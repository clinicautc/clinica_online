const pool = require('../db');

// ---------------------------------------------------------------------------
// CONSULTAS INTERNAS
// ---------------------------------------------------------------------------

/**
 * Busca el practicante óptimo para una cita.
 *
 * Estrategia:
 *   1. Menor cantidad de citas asignadas ese día (citas_hoy ASC)
 *   2. En empate: el que recibió su última asignación hace más tiempo (ultima_asignacion ASC NULLS FIRST)
 *
 * Para citas de fecha futura: usa horarios_practicas + usuarios.status.
 * Para citas del mismo día (esMismoDia): exige adicionalmente que el practicante
 * esté marcado como 'presente' en asistencia_practicantes.
 *
 * Excluye practicantes con conflicto de horario exacto (misma fecha + hora).
 */
async function _buscarPracticante({ area, fecha, hora, esMismoDia, excluirId = null }) {
  const params = [fecha, hora, area];

  let excluirClause = '';
  if (excluirId !== null) {
    params.push(excluirId);
    excluirClause = `AND u.id != $${params.length}`;
  }

  let asistenciaClause = '';
  if (esMismoDia) {
    asistenciaClause = `
      AND EXISTS (
        SELECT 1 FROM asistencia_practicantes ap
        WHERE ap.usuario_id = u.id
          AND ap.fecha = $1
          AND ap.estado = 'presente'
      )
    `;
  }

  const sql = `
    SELECT
      u.id,
      u.nombre,
      (
        SELECT COUNT(*) FROM citas c2
        WHERE c2.practicante_id = u.id
          AND c2.fecha = $1
          AND c2.estado IN ('programada', 'confirmada')
      ) AS citas_hoy,
      (
        SELECT MAX(c3.fecha_asignacion) FROM citas c3
        WHERE c3.practicante_id = u.id
      ) AS ultima_asignacion
    FROM usuarios u
    JOIN horarios_practicas hp ON hp.usuario_id = u.id
      AND hp.dia_semana = EXTRACT(ISODOW FROM $1::date)
      AND hp.activo = true
      AND $2::time >= hp.hora_inicio
      AND $2::time <  hp.hora_fin
    WHERE u.rol     = 'practicante'
      AND u.area    = $3
      AND u.status  = 'activo'
      ${excluirClause}
      ${asistenciaClause}
      AND NOT EXISTS (
        SELECT 1 FROM citas cc
        WHERE cc.practicante_id = u.id
          AND cc.fecha  = $1
          AND cc.hora   = $2
          AND cc.estado IN ('programada', 'confirmada')
      )
    ORDER BY citas_hoy ASC, ultima_asignacion ASC NULLS FIRST
    LIMIT 1
  `;

  const { rows } = await pool.query(sql, params);
  return rows[0] || null;
}

/**
 * Busca un docente administrador del área como último recurso.
 * Los docentes no tienen horarios_practicas, por lo que solo se verifica
 * que no tengan conflicto de horario y que estén activos.
 */
async function _buscarDocente({ area, fecha, hora }) {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre
     FROM usuarios u
     WHERE u.rol    = 'admin'
       AND u.area   = $1
       AND u.status = 'activo'
       AND NOT EXISTS (
         SELECT 1 FROM citas cc
         WHERE cc.practicante_id = u.id
           AND cc.fecha  = $2
           AND cc.hora   = $3
           AND cc.estado IN ('programada', 'confirmada')
       )
     LIMIT 1`,
    [area, fecha, hora]
  );
  return rows[0] || null;
}

/**
 * Persiste la asignación en la tabla citas.
 */
async function _guardarAsignacion(citaId, candidato) {
  const { rows } = await pool.query(
    `UPDATE citas
     SET practicante_id     = $1,
         practicante_nombre = $2,
         estado             = 'programada',
         fecha_asignacion   = NOW()
     WHERE id = $3
     RETURNING *`,
    [candidato.id, candidato.nombre, citaId]
  );
  return rows[0];
}

/**
 * Marca la cita como pendiente de reprogramación.
 */
async function _marcarPendiente(citaId) {
  const { rows } = await pool.query(
    `UPDATE citas SET estado = 'pendiente_reprogramacion' WHERE id = $1 RETURNING *`,
    [citaId]
  );
  return rows[0];
}

// ---------------------------------------------------------------------------
// API PÚBLICA
// ---------------------------------------------------------------------------

/**
 * Asigna automáticamente un practicante (o docente como fallback) a una cita
 * recién creada.
 *
 * Flujo:
 *   1. Buscar practicante disponible (horarios + sin conflicto)
 *   2. Si no hay → buscar docente admin disponible
 *   3. Si tampoco → estado = 'pendiente_reprogramacion'
 *
 * Retorna:
 *   { cita, asignado: { id, nombre } | null, esFallbackDocente: boolean }
 */
async function asignarPracticante(citaId, area, fecha, hora) {
  const hoy = new Date().toISOString().split('T')[0];
  const esMismoDia = fecha === hoy;

  // Paso 1: practicante
  let candidato = await _buscarPracticante({ area, fecha, hora, esMismoDia });
  let esFallbackDocente = false;

  // Paso 2: docente como fallback
  if (!candidato) {
    candidato = await _buscarDocente({ area, fecha, hora });
    if (candidato) esFallbackDocente = true;
  }

  // Paso 3: pendiente de reprogramación
  if (!candidato) {
    const cita = await _marcarPendiente(citaId);
    return { cita, asignado: null, esFallbackDocente: false };
  }

  const cita = await _guardarAsignacion(citaId, candidato);
  return { cita, asignado: candidato, esFallbackDocente };
}

/**
 * Reasigna automáticamente las citas del día asignadas a un practicante
 * que fue marcado como AUSENTE.
 *
 * Solo aplica si 'fecha' es la fecha actual (la asistencia solo modifica
 * la realidad del día, no la planificación futura).
 *
 * Para cada cita afectada:
 *   1. Buscar practicante presente + disponible en ese horario
 *   2. Si no → buscar docente admin
 *   3. Si no → pendiente_reprogramacion
 *
 * Retorna un array de resultados (reservado para el futuro módulo de notificaciones):
 *   [{ citaId, pacienteId, pacienteNombre, hora, nuevoPracticante, esFallbackDocente, resultado }]
 */
async function reasignarCitasPorAusencia(practicanteAusenteId, fecha, area) {
  const hoy = new Date().toISOString().split('T')[0];
  if (fecha !== hoy) return [];

  const { rows: citasAfectadas } = await pool.query(
    `SELECT id, hora, paciente_id, paciente_nombre
     FROM citas
     WHERE practicante_id = $1
       AND fecha          = $2
       AND estado         IN ('programada', 'confirmada')
     ORDER BY hora ASC`,
    [practicanteAusenteId, fecha]
  );

  if (citasAfectadas.length === 0) return [];

  const resultados = [];

  for (const cita of citasAfectadas) {
    // Buscar practicante presente (excluye al ausente)
    let candidato = await _buscarPracticante({
      area,
      fecha,
      hora: cita.hora,
      esMismoDia: true,
      excluirId: practicanteAusenteId,
    });
    let esFallbackDocente = false;

    // Fallback: docente
    if (!candidato) {
      candidato = await _buscarDocente({ area, fecha, hora: cita.hora });
      if (candidato) esFallbackDocente = true;
    }

    if (candidato) {
      await pool.query(
        `UPDATE citas
         SET practicante_id     = $1,
             practicante_nombre = $2,
             fecha_asignacion   = NOW()
         WHERE id = $3`,
        [candidato.id, candidato.nombre, cita.id]
      );
      resultados.push({
        citaId:          cita.id,
        pacienteId:      cita.paciente_id,
        pacienteNombre:  cita.paciente_nombre,
        hora:            cita.hora,
        nuevoPracticante: candidato,
        esFallbackDocente,
        resultado:       'reasignada',
      });
    } else {
      await pool.query(
        `UPDATE citas SET estado = 'pendiente_reprogramacion' WHERE id = $1`,
        [cita.id]
      );
      resultados.push({
        citaId:          cita.id,
        pacienteId:      cita.paciente_id,
        pacienteNombre:  cita.paciente_nombre,
        hora:            cita.hora,
        nuevoPracticante: null,
        esFallbackDocente: false,
        resultado:       'pendiente_reprogramacion',
      });
    }
  }

  return resultados;
}

module.exports = { asignarPracticante, reasignarCitasPorAusencia };
