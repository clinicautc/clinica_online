const pool = require('../db');
const { reconciliarCitasFuturas } = require('../services/horarioAtencionService');
const { obtenerConfig, calcularFechaSinConflicto } = require('../services/consultoriosService');

const AREAS_VALIDAS = ['nutricion', 'fisioterapia'];

function areaValida(area) {
  return AREAS_VALIDAS.includes(area);
}

// ==========================================================
// HORARIO DE ATENCIÓN (rango recurrente por día de la semana)
// Lectura: cualquier usuario autenticado (el paciente lo necesita para
// construir su calendario de citas). Escritura: solo master.
// ==========================================================

async function getHorarios(req, res) {
  const { area } = req.params;
  if (!areaValida(area)) return res.status(400).json({ error: 'Área inválida.' });

  try {
    const result = await pool.query(
      `SELECT dia_semana, hora_inicio, hora_fin, activo
       FROM horarios_atencion WHERE area = $1 ORDER BY dia_semana`,
      [area]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function upsertHorarios(req, res) {
  const { area } = req.params;
  const { dias } = req.body;

  if (!areaValida(area)) return res.status(400).json({ error: 'Área inválida.' });
  if (!Array.isArray(dias) || dias.length === 0) {
    return res.status(400).json({ error: 'dias debe ser un arreglo no vacío.' });
  }

  for (const dia of dias) {
    if (!Number.isInteger(dia.dia_semana) || dia.dia_semana < 1 || dia.dia_semana > 7) {
      return res.status(400).json({ error: 'dia_semana inválido (debe ser 1-7).' });
    }
    if (dia.activo && !(dia.hora_inicio && dia.hora_fin && dia.hora_inicio < dia.hora_fin)) {
      return res.status(400).json({ error: `El día ${dia.dia_semana} necesita hora_inicio menor a hora_fin.` });
    }
  }

  try {
    for (const dia of dias) {
      await pool.query(
        `INSERT INTO horarios_atencion (area, dia_semana, hora_inicio, hora_fin, activo)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (area, dia_semana) DO UPDATE
           SET hora_inicio = EXCLUDED.hora_inicio,
               hora_fin    = EXCLUDED.hora_fin,
               activo      = EXCLUDED.activo`,
        [area, dia.dia_semana, dia.hora_inicio, dia.hora_fin, !!dia.activo]
      );
    }

    const result = await pool.query(
      `SELECT dia_semana, hora_inicio, hora_fin, activo
       FROM horarios_atencion WHERE area = $1 ORDER BY dia_semana`,
      [area]
    );

    res.json(result.rows);

    // El horario ya quedó guardado — reconciliar citas futuras que dejaron de
    // encajar es un efecto secundario informativo, no bloquea la respuesta.
    reconciliarCitasFuturas(area, req.user?.id).catch(err => {
      console.error('[horarios-atencion] Error al reconciliar citas tras editar horario:', err.message);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==========================================================
// CIERRES DE DÍAS COMPLETOS (fecha puntual, por área)
// ==========================================================

async function getCierres(req, res) {
  const { area } = req.params;
  if (!areaValida(area)) return res.status(400).json({ error: 'Área inválida.' });

  try {
    const result = await pool.query(
      `SELECT id, area, fecha, motivo, created_at
       FROM cierres_clinicos WHERE area = $1 AND fecha >= CURRENT_DATE
       ORDER BY fecha`,
      [area]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function crearCierre(req, res) {
  const { area, fecha, motivo } = req.body;
  if (!areaValida(area)) return res.status(400).json({ error: 'Área inválida.' });
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ error: 'Fecha inválida (formato YYYY-MM-DD).' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO cierres_clinicos (area, fecha, motivo, creado_por)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (area, fecha) DO UPDATE SET motivo = EXCLUDED.motivo
       RETURNING id, area, fecha, motivo, created_at`,
      [area, fecha, motivo || null, req.user?.id || null]
    );

    res.status(201).json(result.rows[0]);

    reconciliarCitasFuturas(area, req.user?.id).catch(err => {
      console.error('[horarios-atencion] Error al reconciliar citas tras cerrar un día:', err.message);
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function eliminarCierre(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM cierres_clinicos WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cierre no encontrado.' });
    res.json({ message: 'Día reabierto correctamente.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ==========================================================
// CONSULTORIOS (capacidad de citas simultáneas por horario)
// Lectura: cualquier usuario autenticado. Escritura: solo master.
// ==========================================================

async function getConsultorios(req, res) {
  const { area } = req.params;
  if (!areaValida(area)) return res.status(400).json({ error: 'Área inválida.' });

  try {
    const config = await obtenerConfig(area);
    res.json({
      area,
      cantidad: config.cantidad,
      cantidadPendiente: config.cantidad_pendiente,
      vigenteDesde: config.vigente_desde,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function aplicarConsultorios(area, cantidad) {
  await pool.query(
    `INSERT INTO consultorios_config (area, cantidad, cantidad_pendiente, vigente_desde)
     VALUES ($1, $2, NULL, NULL)
     ON CONFLICT (area) DO UPDATE SET cantidad = EXCLUDED.cantidad, cantidad_pendiente = NULL, vigente_desde = NULL`,
    [area, cantidad]
  );
}

// Reducir consultorios no puede dejar citas ya agendadas por encima de la
// nueva capacidad. Si hay conflicto, el cambio no se aplica todavía: se
// informa la primera fecha segura (`fechaSugerida`) para que el cliente
// confirme esa fecha u ofrezca una posterior; solo entonces se programa
// (cantidad_pendiente/vigente_desde) para que el cron de scheduledTasks.js
// lo aplique cuando llegue. Aumentar (o dejar igual) nunca genera conflicto,
// así que se aplica siempre de inmediato.
async function upsertConsultorios(req, res) {
  const { area } = req.params;
  const { cantidad, vigenteDesde } = req.body;

  if (!areaValida(area)) return res.status(400).json({ error: 'Área inválida.' });
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 10) {
    return res.status(400).json({ error: 'cantidad debe ser un entero entre 1 y 10.' });
  }
  if (vigenteDesde !== undefined && vigenteDesde !== null && !/^\d{4}-\d{2}-\d{2}$/.test(vigenteDesde)) {
    return res.status(400).json({ error: 'vigenteDesde inválida (formato YYYY-MM-DD).' });
  }

  try {
    const actual = await obtenerConfig(area);

    if (cantidad >= actual.cantidad) {
      await aplicarConsultorios(area, cantidad);
      return res.json({ area, cantidad, cantidadPendiente: null, vigenteDesde: null });
    }

    // Es una reducción.
    const fechaSinConflicto = await calcularFechaSinConflicto(area, cantidad);

    if (!fechaSinConflicto) {
      await aplicarConsultorios(area, cantidad);
      return res.json({ area, cantidad, cantidadPendiente: null, vigenteDesde: null });
    }

    if (!vigenteDesde || vigenteDesde < fechaSinConflicto) {
      return res.status(409).json({ requiereFecha: true, fechaSugerida: fechaSinConflicto });
    }

    const hoyStr = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
    if (vigenteDesde <= hoyStr) {
      await aplicarConsultorios(area, cantidad);
      return res.json({ area, cantidad, cantidadPendiente: null, vigenteDesde: null });
    }

    await pool.query(
      `INSERT INTO consultorios_config (area, cantidad, cantidad_pendiente, vigente_desde)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (area) DO UPDATE SET cantidad_pendiente = EXCLUDED.cantidad_pendiente, vigente_desde = EXCLUDED.vigente_desde`,
      [area, actual.cantidad, cantidad, vigenteDesde]
    );
    res.json({ area, cantidad: actual.cantidad, cantidadPendiente: cantidad, vigenteDesde });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getHorarios, upsertHorarios, getCierres, crearCierre, eliminarCierre,
  getConsultorios, upsertConsultorios,
};
