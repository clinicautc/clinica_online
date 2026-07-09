const pool = require('../db');
const { asignarPracticante } = require('../services/asignacionService');
const notificationService = require('../services/notificationService');
const { getTipoConsulta, getDocumentosRequeridos } = require('../services/consultaConfig');

// Compara solo la parte de fecha (yyyy-MM-dd), ignorando hora/zona horaria.
function esFechaPasada(fecha) {
  const fechaStr = new Date(fecha).toISOString().split('T')[0];
  const hoyStr = new Date().toISOString().split('T')[0];
  return fechaStr < hoyStr;
}

function getFechaMexico() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
}

function getHoraMexico() {
  return new Date().toLocaleTimeString('en-GB', {
    timeZone: 'America/Mexico_City',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function esCitaDeHoy(fechaCita) {
  const fechaStr = new Date(fechaCita).toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });
  return fechaStr === getFechaMexico();
}

// Devuelve true si la hora de la cita + minutosGracia ya pasó en zona México.
function horaVencida(horaCita, minutosGracia = 0) {
  const horaActual = getHoraMexico();
  const [h, m] = horaCita.substring(0, 5).split(':').map(Number);
  const [hA, mA] = horaActual.split(':').map(Number);
  return hA * 60 + mA >= h * 60 + m + minutosGracia;
}

async function escribirAuditoria(citaId, estadoAnterior, estadoNuevo, usuario, motivo = null) {
  await pool.query(
    `INSERT INTO citas_auditoria
       (cita_id, estado_anterior, estado_nuevo, usuario_id, usuario_nombre, usuario_rol, motivo)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      citaId,
      estadoAnterior,
      estadoNuevo,
      usuario?.id   ?? null,
      usuario?.nombre ?? null,
      usuario?.rol  ?? null,
      motivo
    ]
  );
}

// Verifica si el paciente ya tiene historial previo en el área (para determinar tipo de consulta).
async function esConsultaSubsecuente(pacienteId, area) {
  const tabla = area === 'nutricion' ? 'historiales_nutricion' : 'historiales_fisioterapia';
  const result = await pool.query(`SELECT COUNT(*) FROM ${tabla} WHERE paciente_id = $1`, [pacienteId]);
  return parseInt(result.rows[0].count) > 0;
}

// Devuelve los tipos de documentos que ya existen para una cita específica.
async function getDocumentosExistentes(appointmentId, area, tipoConsulta) {
  if (!tipoConsulta) return [];
  const docs = [];

  if (area === 'nutricion') {
    const hist = await pool.query(
      'SELECT id FROM historiales_nutricion WHERE appointment_id = $1 LIMIT 1',
      [appointmentId]
    );
    if (hist.rows.length > 0) {
      docs.push(tipoConsulta === 'primera' ? 'historia_clinica_nutricion' : 'seguimiento_nutricion');
    }
    if (tipoConsulta === 'primera') {
      const consent = await pool.query(
        'SELECT id FROM consentimientos_informados WHERE appointment_id = $1 LIMIT 1',
        [appointmentId]
      );
      if (consent.rows.length > 0) docs.push('consentimiento');
    }
  } else if (area === 'fisioterapia') {
    if (tipoConsulta === 'primera') {
      const hist = await pool.query(
        'SELECT id FROM historiales_fisioterapia WHERE appointment_id = $1 LIMIT 1',
        [appointmentId]
      );
      if (hist.rows.length > 0) docs.push('valoracion_inicial_fisioterapia');
    } else {
      const nota = await pool.query(
        'SELECT id FROM notas_evolucion WHERE appointment_id = $1 LIMIT 1',
        [appointmentId]
      );
      if (nota.rows.length > 0) docs.push('nota_evolutiva');
    }
  }

  return docs;
}

// Verifica si existe cualquier documento clínico para esta cita (sin importar el tipo).
// Se usa en noAsistio cuando tipo_consulta aún es null (cita nunca iniciada).
async function tieneAlgunDocumento(appointmentId) {
  const checks = await Promise.all([
    pool.query('SELECT id FROM historiales_nutricion     WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
    pool.query('SELECT id FROM historiales_fisioterapia  WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
    pool.query('SELECT id FROM notas_evolucion           WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
    pool.query('SELECT id FROM consentimientos_informados WHERE appointment_id = $1 LIMIT 1', [appointmentId]),
  ]);
  return checks.some(r => r.rows.length > 0);
}

async function getAll(req, res) {
  try {
    const result = await pool.query(
      `SELECT c.*,
         NULLIF((SELECT COUNT(*) FROM citas c2
                 WHERE c2.paciente_id = c.paciente_id
                   AND c2.tipo = c.tipo
                   AND c2.id <= c.id
                   AND c2.estado = 'completada'), 0) AS numero_consulta
       FROM citas c
       ORDER BY c.fecha DESC, c.hora DESC`
    );
    const citasEstandarizadas = result.rows.map(cita => ({
      ...cita,
      date: cita.fecha,
      time: cita.hora,
      status: cita.estado,
      numero_consulta: cita.numero_consulta ? parseInt(cita.numero_consulta, 10) : null
    }));
    res.json(citasEstandarizadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// OBTENER CITAS POR PACIENTE
// Se eliminó el filtro de CURRENT_DATE para que el paciente pueda visualizar sus registros previos y actuales.
async function getByPaciente(req, res) {
  const { id } = req.params;

  if (req.user.rol === 'paciente' && String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No puedes ver las citas de otro paciente.' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM citas WHERE paciente_id = $1 ORDER BY fecha DESC, hora DESC`, // Más recientes primero
      [id]
    );

    const citasSincronizadas = result.rows.map(cita => ({
      ...cita,
      tipo: cita.tipo,
      estado: cita.estado
    }));

    res.json(citasSincronizadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// OBTENER DISPONIBILIDAD DE HORARIOS (BLOQUEO POR ÁREA)
async function getDisponibilidad(req, res) {
  const { fecha, tipo } = req.query; // tipo = 'nutricion' o 'fisioterapia'

  if (!fecha || !tipo) {
    return res.status(400).json({ error: "Faltan parámetros de fecha o tipo" });
  }

  try {
    const result = await pool.query(
      `SELECT hora FROM citas WHERE fecha = $1 AND tipo = $2 AND estado IN ('programada', 'en_atencion')`,
      [fecha, tipo.toLowerCase()]
    );

    const horasOcupadas = result.rows.map(row => row.hora);

    res.json(horasOcupadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Devuelve los días del mes que tienen todos los slots posibles (00:00-17:00, 18 slots) ocupados.
const TOTAL_SLOTS_DIA = 18;
async function getDiasCompletos(req, res) {
  const { mes, tipo } = req.query;
  if (!mes || !tipo) return res.status(400).json({ error: 'Faltan parámetros mes o tipo' });

  try {
    const result = await pool.query(
      `SELECT fecha::date::text AS fecha
       FROM citas
       WHERE tipo = $1
         AND estado IN ('programada', 'en_atencion')
         AND TO_CHAR(fecha, 'YYYY-MM') = $2
       GROUP BY fecha::date
       HAVING COUNT(DISTINCT LEFT(hora::text, 5)) >= $3`,
      [tipo.toLowerCase(), mes, TOTAL_SLOTS_DIA]
    );
    res.json(result.rows.map(r => r.fecha));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  const { paciente_id, paciente_nombre, tipo, fecha, hora } = req.body;
  const area = tipo.toLowerCase();

  try {
    const conflictoPaciente = await pool.query(
      "SELECT tipo FROM citas WHERE paciente_id = $1 AND fecha = $2 AND hora = $3 AND estado IN ('programada', 'en_atencion')",
      [paciente_id, fecha, hora]
    );

    if (conflictoPaciente.rows.length > 0) {
      const areaExistente = conflictoPaciente.rows[0].tipo;
      const areaFormateada = areaExistente === 'nutricion' ? 'Nutrición' : 'Fisioterapia';
      return res.status(409).json({ error: `Ya tienes una cita de ${areaFormateada} a esa hora. Selecciona un horario distinto.` });
    }

    const check = await pool.query(
      "SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'en_atencion')",
      [fecha, hora, area]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ error: "Este horario ya fue ocupado en esta área. Por favor elige otro." });
    }

    // Insertar la cita sin practicante todavía
    const inserted = await pool.query(
      `INSERT INTO citas (paciente_id, paciente_nombre, tipo, fecha, hora, estado)
       VALUES ($1, $2, $3, $4, $5, 'programada') RETURNING *`,
      [paciente_id, paciente_nombre, area, fecha, hora]
    );
    const nuevaCita = inserted.rows[0];

    // Asignación automática
    const { cita, asignado, esFallbackDocente } = await asignarPracticante(
      nuevaCita.id, area, fecha, hora
    );

    // Notificaciones informativas — se disparan sin bloquear la respuesta.
    // Si fallan, el error queda registrado en consola. La cita ya existe en BD.
    const pacienteResult = await pool.query(
      'SELECT email FROM usuarios WHERE id = $1', [paciente_id]
    );
    if (pacienteResult.rows.length > 0) {
      // Incluye el practicante en el correo del paciente si ya viene asignado
      notificationService.notificarCitaCreada(
        paciente_nombre, pacienteResult.rows[0].email, fecha, hora, area,
        asignado ? asignado.nombre : null
      );
    }

    if (asignado) {
      const practicanteResult = await pool.query(
        'SELECT email FROM usuarios WHERE id = $1', [cita.practicante_id]
      );
      if (practicanteResult.rows.length > 0) {
        notificationService.notificarAsignacionAutomatica(
          asignado.nombre, practicanteResult.rows[0].email, paciente_nombre, fecha, hora, area
        );
      }
    }

    res.status(201).json({ ...cita, asignado, esFallbackDocente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// REAGENDAR O MODIFICAR CITA
async function update(req, res) {
  const { id } = req.params;
  const { fecha, hora, tipo, estado } = req.body;

  try {
    const citaActual = await pool.query("SELECT * FROM citas WHERE id = $1", [id]);

    if (citaActual.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const original = citaActual.rows[0];

    // Usar los valores del body si vienen, si no mantener los de la cita original
    const nuevaFecha = fecha ?? new Date(original.fecha).toISOString().split('T')[0];
    const nuevaHora  = hora  ?? original.hora;
    const nuevoTipo  = tipo  ?? original.tipo;

    const fechaOriginalStr = new Date(original.fecha).toISOString().split('T')[0];
    const horaOriginalStr  = original.hora.substring(0, 5);
    const esReagendamiento = nuevaFecha !== fechaOriginalStr || nuevaHora.substring(0, 5) !== horaOriginalStr;

    if (esReagendamiento) {
      if (['completada', 'en_atencion', 'no_asistio'].includes(original.estado)) {
        return res.status(409).json({ error: "No se puede reagendar una cita en ese estado." });
      }
      if (esFechaPasada(original.fecha)) {
        return res.status(409).json({ error: "No se puede reagendar una cita de una fecha pasada." });
      }

      // Solo verificar conflicto de horario cuando realmente cambia fecha u hora
      const check = await pool.query(
        "SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'en_atencion') AND id != $4",
        [nuevaFecha, nuevaHora, nuevoTipo.toLowerCase(), id]
      );
      if (check.rows.length > 0) {
        return res.status(409).json({ error: "Este horario ya está ocupado. Elige otro." });
      }
    }

    const result = await pool.query(
      `UPDATE citas SET fecha = $1, hora = $2, estado = $3 WHERE id = $4 RETURNING *`,
      [nuevaFecha, nuevaHora, estado ?? original.estado, id]
    );

    if (result.rows.length > 0) {
      if (esReagendamiento) {
        await pool.query(
          "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
          ['cita_reagendada', result.rows[0].tipo, result.rows[0].paciente_id, JSON.stringify({ nueva_fecha: nuevaFecha, nueva_hora: nuevaHora })]
        );
      }
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Cita no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  try {
    const citaPrevia = await pool.query("SELECT * FROM citas WHERE id = $1", [id]);
    if (citaPrevia.rowCount > 0) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id) VALUES ($1, $2, $3)",
        ['cita_cancelada', citaPrevia.rows[0].tipo, citaPrevia.rows[0].paciente_id]
      );
    }
    const result = await pool.query('DELETE FROM citas WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount > 0) {
      res.json({ message: "Cita eliminada correctamente" });
    } else {
      res.status(404).json({ error: "No se encontró la cita" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function asignar(req, res) {
  const { id } = req.params;
  const { practicante_id, practicante_nombre } = req.body;

  try {
    const citaActual = await pool.query("SELECT fecha, estado FROM citas WHERE id = $1", [id]);

    if (citaActual.rows.length === 0) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    const original = citaActual.rows[0];

    if (['completada', 'en_atencion', 'no_asistio'].includes(original.estado)) {
      return res.status(409).json({ error: "No se puede asignar un practicante a una cita en ese estado." });
    }
    if (esFechaPasada(original.fecha)) {
      return res.status(409).json({ error: "No se puede asignar un practicante a una cita de una fecha pasada." });
    }

    const result = await pool.query(
      `UPDATE citas SET practicante_id = $1, practicante_nombre = $2, estado = 'programada', fecha_asignacion = NOW() WHERE id = $3 RETURNING *`,
      [practicante_id, practicante_nombre, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No se encontró la cita." });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];
    const rol = req.user.rol;

    if (rol === 'paciente' && String(cita.paciente_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (rol === 'practicante' && String(cita.practicante_id) !== String(req.user.id)) {
      return res.status(403).json({ error: 'No autorizado' });
    }
    if (rol === 'admin' && cita.tipo !== req.user.area) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    let documentosExistentes = [];
    if (cita.tipo_consulta) {
      documentosExistentes = await getDocumentosExistentes(id, cita.tipo, cita.tipo_consulta);
    }
    const documentosRequeridos = cita.tipo_consulta
      ? getDocumentosRequeridos(cita.tipo, cita.tipo_consulta)
      : [];

    const numResult = await pool.query(
      `SELECT COUNT(*) AS numero_consulta FROM citas
       WHERE paciente_id = $1 AND tipo = $2 AND id <= $3 AND estado = 'completada'`,
      [cita.paciente_id, cita.tipo, id]
    );
    const numero_consulta = parseInt(numResult.rows[0].numero_consulta, 10);

    res.json({ ...cita, documentosExistentes, documentosRequeridos, numero_consulta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function iniciar(req, res) {
  const { id } = req.params;
  const usuario = req.user;

  if (usuario.rol !== 'practicante') {
    return res.status(403).json({ error: 'Solo el practicante asignado puede iniciar la consulta.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (String(cita.practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'Solo el practicante asignado puede iniciar la consulta.' });
    }

    const esProgramada  = cita.estado === 'programada';
    const esRecuperada  = cita.estado === 'recuperada';

    if (!esProgramada && !esRecuperada) {
      return res.status(409).json({ error: 'La cita no está en un estado que permita iniciarla.', estadoActual: cita.estado });
    }

    let tipoConsulta = cita.tipo_consulta;
    let updated;

    if (esProgramada) {
      if (!esCitaDeHoy(cita.fecha)) {
        return res.status(409).json({ error: 'Solo se pueden iniciar citas del día de hoy.' });
      }
      const horaActual = getHoraMexico();
      const horaActualHH = parseInt(horaActual.split(':')[0], 10);
      const citaHH = parseInt(cita.hora.substring(0, 2), 10);
      if (citaHH !== horaActualHH) {
        return res.status(409).json({
          error: `Solo puedes iniciar citas de la hora actual (${horaActual}). Esta cita es a las ${cita.hora.substring(0, 5)}.`
        });
      }

      const subsecuente = await esConsultaSubsecuente(cita.paciente_id, cita.tipo);
      tipoConsulta = getTipoConsulta(cita.tipo, subsecuente);

      updated = await pool.query(
        `UPDATE citas
            SET estado = 'en_atencion',
                tipo_consulta = $1,
                iniciada_en = NOW(),
                timer_expira_en = (fecha + hora) AT TIME ZONE 'America/Mexico_City' + INTERVAL '90 minutes'
          WHERE id = $2 AND estado = 'programada'
          RETURNING *`,
        [tipoConsulta, id]
      );

      if (updated.rows.length === 0) {
        return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
      }

      await escribirAuditoria(id, 'programada', 'en_atencion', usuario, null);

      if (subsecuente) {
        await pool.query(
          "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
          ['paciente_recurrente', cita.tipo, cita.paciente_id, JSON.stringify({ cita_id: id })]
        );
      }
    } else {
      // recuperada → en_atencion: el timer arranca desde ahora
      updated = await pool.query(
        `UPDATE citas
            SET estado = 'en_atencion',
                timer_expira_en = NOW() + INTERVAL '90 minutes'
          WHERE id = $1 AND estado = 'recuperada'
          RETURNING *`,
        [id]
      );

      if (updated.rows.length === 0) {
        return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
      }

      await escribirAuditoria(id, 'recuperada', 'en_atencion', usuario, null);
    }

    const documentosRequeridos = getDocumentosRequeridos(cita.tipo, tipoConsulta);
    res.json({ ...updated.rows[0], documentosRequeridos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function recuperar(req, res) {
  const { id } = req.params;
  const usuario = req.user;
  const rol = usuario.rol;

  if (!['admin', 'master'].includes(rol)) {
    return res.status(403).json({ error: 'Solo admin o master pueden recuperar una cita incompleta.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (rol === 'admin' && cita.tipo !== usuario.area) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (cita.estado !== 'incompleta') {
      return res.status(409).json({ error: 'Solo se puede recuperar una cita incompleta.', estadoActual: cita.estado });
    }

    const updated = await pool.query(
      `UPDATE citas SET estado = 'recuperada' WHERE id = $1 AND estado = 'incompleta' RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, 'incompleta', 'recuperada', usuario, null);

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function finalizar(req, res) {
  const { id } = req.params;
  const usuario = req.user;

  if (usuario.rol !== 'practicante') {
    return res.status(403).json({ error: 'Solo el practicante asignado puede finalizar la consulta.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (String(cita.practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'Solo el practicante asignado puede finalizar la consulta.' });
    }
    if (cita.estado !== 'en_atencion') {
      return res.status(409).json({ error: 'La cita no está en atención.', estadoActual: cita.estado });
    }

    const documentosExistentes = await getDocumentosExistentes(id, cita.tipo, cita.tipo_consulta);
    const documentosRequeridos = getDocumentosRequeridos(cita.tipo, cita.tipo_consulta);
    const faltantes = documentosRequeridos.filter(d => !documentosExistentes.includes(d));

    if (faltantes.length > 0) {
      return res.status(422).json({
        error: 'Faltan documentos clínicos requeridos.',
        documentosFaltantes: faltantes,
        documentosExistentes
      });
    }

    const updated = await pool.query(
      `UPDATE citas
          SET estado = 'completada',
              finalizada_en = NOW(),
              borrador = NULL,
              borrador_actualizado_en = NULL
        WHERE id = $1 AND estado = 'en_atencion'
        RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, 'en_atencion', 'completada', usuario, null);

    await pool.query(
      "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
      ['cita_completada', cita.tipo, cita.paciente_id, JSON.stringify({ cita_id: id, tipo_consulta: cita.tipo_consulta })]
    );

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function noAsistio(req, res) {
  const { id } = req.params;
  const usuario = req.user;
  const rol = usuario.rol;

  if (!['practicante', 'admin', 'master'].includes(rol)) {
    return res.status(403).json({ error: 'No autorizado.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (rol === 'practicante' && String(cita.practicante_id) !== String(usuario.id)) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (rol === 'admin' && cita.tipo !== usuario.area) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (!['programada', 'en_atencion'].includes(cita.estado)) {
      return res.status(409).json({ error: 'La cita no puede marcarse como no asistió en su estado actual.', estadoActual: cita.estado });
    }

    const tipoConsultaParaCheck = cita.tipo_consulta;
    let tieneDocumentos = false;
    if (tipoConsultaParaCheck) {
      const docs = await getDocumentosExistentes(id, cita.tipo, tipoConsultaParaCheck);
      tieneDocumentos = docs.length > 0;
    } else {
      tieneDocumentos = await tieneAlgunDocumento(id);
    }

    if (tieneDocumentos) {
      return res.status(422).json({ error: 'No se puede marcar como no asistió: existen documentos clínicos registrados para esta cita.' });
    }

    if (!horaVencida(cita.hora.substring(0, 5), 15)) {
      return res.status(422).json({ error: 'Todavía no han pasado 15 minutos desde la hora de la cita.' });
    }

    const updated = await pool.query(
      `UPDATE citas
          SET estado = 'no_asistio',
              finalizada_en = NOW(),
              borrador = NULL,
              borrador_actualizado_en = NULL
        WHERE id = $1 AND estado = ANY($2::text[])
        RETURNING *`,
      [id, ['programada', 'en_atencion']]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, cita.estado, 'no_asistio', usuario, 'Paciente no se presentó');

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function revertirAProgramada(req, res) {
  const { id } = req.params;
  const { motivo } = req.body;
  const usuario = req.user;
  const rol = usuario.rol;

  if (!['admin', 'master'].includes(rol)) {
    return res.status(403).json({ error: 'Solo admin o master pueden revertir una cita a programada.' });
  }
  if (!motivo || motivo.trim().length === 0) {
    return res.status(400).json({ error: 'Se requiere un motivo para revertir la cita.' });
  }

  try {
    const result = await pool.query('SELECT * FROM citas WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });

    const cita = result.rows[0];

    if (rol === 'admin' && cita.tipo !== usuario.area) {
      return res.status(403).json({ error: 'No autorizado.' });
    }
    if (cita.estado !== 'en_atencion') {
      return res.status(409).json({ error: 'Solo se puede revertir una cita que esté en atención.', estadoActual: cita.estado });
    }

    const updated = await pool.query(
      `UPDATE citas
          SET estado = 'programada',
              iniciada_en = NULL,
              tipo_consulta = NULL,
              borrador = NULL,
              borrador_actualizado_en = NULL
        WHERE id = $1 AND estado = 'en_atencion'
        RETURNING *`,
      [id]
    );

    if (updated.rows.length === 0) {
      return res.status(409).json({ error: 'Conflicto: la cita ya fue modificada.', estadoActual: cita.estado });
    }

    await escribirAuditoria(id, 'en_atencion', 'programada', usuario, motivo.trim());

    res.json(updated.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function guardarBorrador(req, res) {
  const { id } = req.params;
  const { borrador } = req.body;
  const usuario = req.user;

  if (usuario.rol !== 'practicante') {
    return res.status(403).json({ error: 'Solo el practicante puede guardar el borrador.' });
  }
  if (borrador === undefined || borrador === null) {
    return res.status(400).json({ error: 'Se requiere el campo borrador.' });
  }

  try {
    const result = await pool.query(
      `UPDATE citas
          SET borrador = $1,
              borrador_actualizado_en = NOW()
        WHERE id = $2 AND practicante_id = $3 AND estado = 'en_atencion'
        RETURNING id, borrador_actualizado_en`,
      [borrador, id, usuario.id]
    );

    if (result.rows.length === 0) {
      const check = await pool.query('SELECT estado, practicante_id FROM citas WHERE id = $1', [id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Cita no encontrada' });
      if (String(check.rows[0].practicante_id) !== String(usuario.id)) {
        return res.status(403).json({ error: 'No autorizado.' });
      }
      return res.status(409).json({ error: 'La cita ya no está en atención.', estadoActual: check.rows[0].estado });
    }

    res.json({ ok: true, borrador_actualizado_en: result.rows[0].borrador_actualizado_en });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  getAll, getByPaciente, getDisponibilidad, getDiasCompletos, create, update, remove, asignar,
  getById, iniciar, finalizar, noAsistio, revertirAProgramada, guardarBorrador, recuperar
};
