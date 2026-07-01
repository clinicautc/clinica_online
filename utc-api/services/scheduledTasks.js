const pool = require('../db');

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
// ARRANQUE
// ---------------------------------------------------------------------------

function iniciarTareasProgramadas() {
  // Al arrancar: primero correr el cierre si corresponde, luego sincronizar
  // desde asistencia. La cadena es no bloqueante — el servidor queda listo
  // mientras esto corre en background.
  verificarYDesactivarPracticantes()
    .then(() => sincronizarStatusDesdeAsistencia())
    .catch(err => console.error('[startup] Error en init de tareas:', err.message));

  setInterval(verificarYDesactivarPracticantes, 60000);
}

module.exports = { iniciarTareasProgramadas };
