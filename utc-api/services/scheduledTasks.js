const pool = require('../db');
const notificationService = require('./notificationService');

// ---------------------------------------------------------------------------
// DESACTIVACIÓN DIARIA
// Se ejecuta a partir de las 00:38 hora México (inicio del nuevo día clínico).
// El flag persiste en logs_sistema para sobrevivir reinicios del servidor.
// ---------------------------------------------------------------------------

async function verificarYDesactivarPracticantes() {
  try {
    const ahora = new Date().toLocaleTimeString("en-GB", {
      timeZone: "America/Mexico_City",
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    if (ahora < "00:38") return;

    // Verificar en DB si ya se ejecutó en el día clínico actual (zona México)
    const { rows } = await pool.query(
      `SELECT id FROM logs_sistema
       WHERE tipo = 'cierre_automatico'
         AND fecha::date = (NOW() AT TIME ZONE 'America/Mexico_City')::date
       LIMIT 1`
    );
    if (rows.length > 0) return;

    const result = await pool.query(
      "UPDATE usuarios SET status = 'inactivo' WHERE rol = 'practicante' AND status = 'activo'"
    );

    await pool.query(
      "INSERT INTO logs_sistema (tipo, descripcion) VALUES ($1, $2)",
      ['cierre_automatico', `Cierre de las 00:38 ejecutado — ${result.rowCount} practicante(s) desactivados`]
    );

    if (result.rowCount > 0) {
      console.log(`[auto-cierre] ${ahora} — ${result.rowCount} practicante(s) desactivados.`);
    }
  } catch (error) {
    console.error("[scheduledTasks] Error en desactivación:", error.message);
  }
}

// ---------------------------------------------------------------------------
// SYNC DE STATUS AL ARRANCAR
// Re-aplica el status correcto desde la asistencia registrada hoy.
// Esto corrige el caso de un reinicio del servidor después de que el admin
// ya tomó asistencia: los 'presente' vuelven a quedar 'activo'.
// ---------------------------------------------------------------------------

async function sincronizarStatusDesdeAsistencia() {
  const hoy = new Date().toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  try {
    await pool.query(
      `UPDATE usuarios u SET status = 'activo'
       FROM asistencia_practicantes ap
       WHERE ap.usuario_id = u.id
         AND ap.fecha = $1
         AND ap.estado = 'presente'
         AND u.rol = 'practicante'`,
      [hoy]
    );
    await pool.query(
      `UPDATE usuarios u SET status = 'inactivo'
       FROM asistencia_practicantes ap
       WHERE ap.usuario_id = u.id
         AND ap.fecha = $1
         AND ap.estado = 'ausente'
         AND u.rol = 'practicante'`,
      [hoy]
    );
    console.log(`[startup] Status de practicantes sincronizado desde asistencia del ${hoy}`);
  } catch (err) {
    console.error('[startup] Error al sincronizar status:', err.message);
  }
}

// ---------------------------------------------------------------------------
// CIERRE AUTOMÁTICO DE CITAS NO ATENDIDAS
// Se ejecuta cada minuto.
//
// Regla 1: programada → no_asistio
//   - Estado = 'programada', fecha = hoy (zona México)
//   - Hora de la cita + 15 min de gracia ya pasó
//   - Sin documentos clínicos vinculados
//
// Regla 2: en_atencion → incompleta  (reemplaza la anterior en_atencion → no_asistio)
//   - Estado = 'en_atencion'
//   - timer_expira_en < NOW()  (el timer de 90 min venció)
//   - Sin importar si hay documentos: el practicante tuvo su ventana y no finalizó
//   - El borrador se conserva para que pueda recuperarse
// ---------------------------------------------------------------------------

async function cerrarCitasNoAtendidas() {
  try {
    const noDocsFilter = `
      AND NOT EXISTS (SELECT 1 FROM historiales_nutricion      WHERE appointment_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM historiales_fisioterapia   WHERE appointment_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM notas_evolucion            WHERE appointment_id = c.id)
      AND NOT EXISTS (SELECT 1 FROM consentimientos_informados WHERE appointment_id = c.id)
    `;

    // Regla 1: programada → no_asistio: solo hoy, 15 min de gracia, sin documentos
    const resProgramadas = await pool.query(
      `UPDATE citas c
          SET estado = 'no_asistio',
              finalizada_en = NOW()
        WHERE c.estado = 'programada'
          AND c.fecha = (NOW() AT TIME ZONE 'America/Mexico_City')::date
          AND (c.fecha + c.hora)::timestamp + INTERVAL '15 minutes'
              < (NOW() AT TIME ZONE 'America/Mexico_City')::timestamp
          ${noDocsFilter}
        RETURNING id, paciente_id, tipo, hora`
    );

    // Regla 2: en_atencion → incompleta: timer_expira_en vencido
    // El borrador se conserva (no se limpia) para que pueda recuperarse.
    const resEnAtencion = await pool.query(
      `UPDATE citas c
          SET estado = 'incompleta',
              finalizada_en = NOW()
        WHERE c.estado = 'en_atencion'
          AND c.timer_expira_en IS NOT NULL
          AND c.timer_expira_en < NOW()
        RETURNING id, paciente_id, tipo, hora`
    );

    const todasNoPresentaron = resProgramadas.rows.map(c => ({ ...c, estadoAnterior: 'programada' }));
    const todasIncompletas   = resEnAtencion.rows.map(c => ({ ...c, estadoAnterior: 'en_atencion' }));

    for (const cita of todasNoPresentaron) {
      await pool.query(
        `INSERT INTO citas_auditoria
           (cita_id, estado_anterior, estado_nuevo, usuario_id, usuario_nombre, usuario_rol, motivo)
         VALUES ($1, $2, 'no_asistio', NULL, NULL, NULL, 'Cierre automático: paciente no se presentó')`,
        [cita.id, cita.estadoAnterior]
      );
    }

    for (const cita of todasIncompletas) {
      await pool.query(
        `INSERT INTO citas_auditoria
           (cita_id, estado_anterior, estado_nuevo, usuario_id, usuario_nombre, usuario_rol, motivo)
         VALUES ($1, 'en_atencion', 'incompleta', NULL, NULL, NULL, 'Cierre automático: tiempo de consulta agotado')`,
        [cita.id]
      );
    }

    if (todasNoPresentaron.length > 0) {
      console.log(`[auto-cierre] ${todasNoPresentaron.length} cita(s) → no_asistio: [${todasNoPresentaron.map(c => `#${c.id}`).join(', ')}]`);
    }
    if (todasIncompletas.length > 0) {
      console.log(`[auto-cierre] ${todasIncompletas.length} cita(s) → incompleta: [${todasIncompletas.map(c => `#${c.id}`).join(', ')}]`);
    }
  } catch (error) {
    console.error('[scheduledTasks] Error en cerrarCitasNoAtendidas:', error.message);
  }
}

// ---------------------------------------------------------------------------
// RECORDATORIO DE CITA (24 HORAS ANTES, SOLO AL PACIENTE)
// Se ejecuta cada minuto. En cuanto una cita 'programada' entra dentro de las
// próximas 24 horas se marca recordatorio_enviado = true (claim atómico vía
// UPDATE...RETURNING, igual que cerrarCitasNoAtendidas) y recién después se
// manda el correo — así un tick concurrente nunca puede reenviarlo dos veces.
// ---------------------------------------------------------------------------

async function enviarRecordatoriosCitas() {
  try {
    const { rows } = await pool.query(
      `UPDATE citas c
          SET recordatorio_enviado = true
        WHERE c.estado = 'programada'
          AND c.recordatorio_enviado = false
          AND (c.fecha + c.hora)::timestamp <= (NOW() AT TIME ZONE 'America/Mexico_City')::timestamp + INTERVAL '24 hours'
          AND (c.fecha + c.hora)::timestamp > (NOW() AT TIME ZONE 'America/Mexico_City')::timestamp
        RETURNING id, paciente_id, paciente_nombre, practicante_nombre, tipo, fecha, hora`
    );

    for (const cita of rows) {
      try {
        const { rows: pacRows } = await pool.query('SELECT email FROM usuarios WHERE id = $1', [cita.paciente_id]);
        if (pacRows.length === 0) continue;
        await notificationService.notificarRecordatorioCita(
          cita.paciente_nombre, pacRows[0].email, cita.fecha, cita.hora, cita.tipo, cita.practicante_nombre
        );
      } catch (err) {
        console.error('[recordatorio-cita] Error al notificar cita', cita.id, ':', err.message);
      }
    }

    if (rows.length > 0) {
      console.log(`[recordatorio-cita] ${rows.length} recordatorio(s) enviado(s): [${rows.map(c => `#${c.id}`).join(', ')}]`);
    }
  } catch (error) {
    console.error('[scheduledTasks] Error en enviarRecordatoriosCitas:', error.message);
  }
}

// ---------------------------------------------------------------------------
// ARRANQUE
// ---------------------------------------------------------------------------

async function tick() {
  await verificarYDesactivarPracticantes();
  await cerrarCitasNoAtendidas();
  await enviarRecordatoriosCitas();
}

function iniciarTareasProgramadas() {
  // Al arrancar: primero correr el tick completo, luego sincronizar desde asistencia.
  // La cadena es no bloqueante — el servidor queda listo mientras esto corre en background.
  tick()
    .then(() => sincronizarStatusDesdeAsistencia())
    .catch(err => console.error('[startup] Error en init de tareas:', err.message));

  setInterval(tick, 60000);
}

module.exports = { iniciarTareasProgramadas };
