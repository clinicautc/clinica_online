const pool = require('../db');
const { obtenerColumnaDeConsulta } = require('../services/seguimientoNutricionalCampos');
const { assertCitaEditablePorUsuario } = require('../middleware/authMiddleware');

/**
 * Seguimiento Nutricional — exclusivo de nutrición (fisioterapia sigue usando
 * notasController/notas_evolucion tal cual, sin este comportamiento).
 *
 * Un mismo registro `notas_evolucion` acumula hasta 6 consultas subsecuentes
 * (columnas 1-6); la 7ª subsecuente cierra el ciclo y la 8ª abre un
 * documento nuevo desde la columna 1. La posición se calcula SIEMPRE a
 * partir del historial real de citas — nunca se guarda como campo aparte —
 * para que la secuencia clínica sea trazable y no se pueda reordenar ni
 * reutilizar una columna ya ocupada.
 */

// Cuenta cuántas consultas subsecuentes de nutrición (completadas o la actual
// en_atencion) preceden — o son — la cita dada, y de ahí deriva la columna
// (1-6) que le corresponde dentro de su ciclo de 6.
async function calcularPosicion(pacienteId, appointmentId) {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS n FROM citas
     WHERE paciente_id = $1 AND tipo = 'nutricion' AND tipo_consulta = 'subsecuente'
       AND estado IN ('completada', 'en_atencion') AND id <= $2`,
    [pacienteId, appointmentId]
  );
  const subsecuentePosition = result.rows[0].n;
  const columna = subsecuentePosition > 0 ? ((subsecuentePosition - 1) % 6) + 1 : null;
  return { subsecuentePosition, columna };
}

// Localiza la fila notas_evolucion que corresponde a esta cita: si es
// columna 1, es la que nació con este mismo appointment_id (o aún no
// existe); si es columna 2-6, es la más reciente del paciente en nutrición
// (documento abierto que se sigue llenando).
async function localizarDocumento(pacienteId, appointmentId, columna) {
  if (columna === 1) {
    const r = await pool.query('SELECT * FROM notas_evolucion WHERE appointment_id = $1', [appointmentId]);
    return r.rows[0] || null;
  }
  const r = await pool.query(
    `SELECT * FROM notas_evolucion WHERE paciente_id = $1 AND area = 'nutricion' ORDER BY id DESC LIMIT 1`,
    [pacienteId]
  );
  return r.rows[0] || null;
}

function parseCuadro(fila) {
  if (!fila) return {};
  if (typeof fila.cuadro_evolucion === 'string') {
    try { return JSON.parse(fila.cuadro_evolucion); } catch { return {}; }
  }
  return fila.cuadro_evolucion || {};
}

async function cargarCitaSubsecuente(appointmentId) {
  const result = await pool.query(
    'SELECT id, paciente_id, paciente_nombre, tipo, tipo_consulta, estado FROM citas WHERE id = $1',
    [appointmentId]
  );
  if (result.rows.length === 0) return null;
  const cita = result.rows[0];
  if (cita.tipo !== 'nutricion' || cita.tipo_consulta !== 'subsecuente') return undefined;
  return cita;
}

async function getSeguimiento(req, res) {
  const { appointmentId } = req.params;
  try {
    const cita = await cargarCitaSubsecuente(appointmentId);
    if (cita === null) return res.status(404).json({ error: 'Cita no encontrada' });
    if (cita === undefined) return res.status(400).json({ error: 'Esta cita no corresponde a un seguimiento nutricional subsecuente' });

    const { columna } = await calcularPosicion(cita.paciente_id, cita.id);
    if (!columna) return res.status(500).json({ error: 'No se pudo determinar la columna de seguimiento' });

    const fila = await localizarDocumento(cita.paciente_id, cita.id, columna);

    res.json({
      notaId: fila ? fila.id : null,
      columnaActual: columna,
      estadoCita: cita.estado,
      cuadro_evolucion: parseCuadro(fila),
      paciente_id: cita.paciente_id,
      paciente_nombre: cita.paciente_nombre,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function guardarSeguimiento(req, res) {
  const { appointmentId } = req.params;
  const cambios = req.body?.cuadro_evolucion || {};
  const user = req.user;

  try {
    const cita = await cargarCitaSubsecuente(appointmentId);
    if (cita === null) return res.status(404).json({ error: 'Cita no encontrada' });
    if (cita === undefined) return res.status(400).json({ error: 'Esta cita no corresponde a un seguimiento nutricional subsecuente' });

    const esPrivilegiado = user.rol === 'admin' || user.rol === 'master';
    if (!esPrivilegiado) {
      await assertCitaEditablePorUsuario(cita.id, user);
    }

    const { columna } = await calcularPosicion(cita.paciente_id, cita.id);
    if (!columna) return res.status(500).json({ error: 'No se pudo determinar la columna de seguimiento' });

    const filaExistente = await localizarDocumento(cita.paciente_id, cita.id, columna);
    if (!filaExistente && columna > 1 && !esPrivilegiado) {
      return res.status(409).json({ error: 'No existe un documento de seguimiento abierto para continuar' });
    }

    const cuadroActual = parseCuadro(filaExistente);

    // Un practicante nunca puede reescribir una columna ya registrada (usa la
    // fecha de esa columna como marcador de "ya se llenó"); admin/master sí.
    if (!esPrivilegiado && cuadroActual[`psi_fecha_${columna}`]) {
      return res.status(409).json({ error: 'Esta columna ya fue registrada anteriormente' });
    }

    // Fusión defensiva: solo se aceptan campos ajenos al eje de consulta
    // (metadatos, contenido paralelo) o los que pertenecen exactamente a
    // `columna` — cualquier intento de tocar otra columna se descarta.
    const cuadroFusionado = { ...cuadroActual };
    for (const [campo, valor] of Object.entries(cambios)) {
      const columnaDelCampo = obtenerColumnaDeConsulta(campo);
      if (columnaDelCampo === null || columnaDelCampo === columna || esPrivilegiado) {
        cuadroFusionado[campo] = valor;
      }
    }

    if (filaExistente) {
      const upd = await pool.query(
        'UPDATE notas_evolucion SET cuadro_evolucion = $1 WHERE id = $2 RETURNING *',
        [JSON.stringify(cuadroFusionado), filaExistente.id]
      );
      return res.json(upd.rows[0]);
    }

    const ins = await pool.query(
      `INSERT INTO notas_evolucion (paciente_id, practicante_id, appointment_id, nombre_completo, fecha_elaboracion, cuadro_evolucion, area, fecha_creacion)
       VALUES ($1, $2, $3, $4, NOW(), $5, 'nutricion', NOW()) RETURNING *`,
      [cita.paciente_id, user.id, cita.id, cita.paciente_nombre, JSON.stringify(cuadroFusionado)]
    );
    return res.status(201).json(ins.rows[0]);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = { getSeguimiento, guardarSeguimiento, calcularPosicion };
