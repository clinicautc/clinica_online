const pool = require('../db');

const HORA_DESACTIVACION = "00:38";
let yaEjecutoHoy = false;

async function verificarYDesactivarPracticantes() {
  try {
    const ahora = new Date().toLocaleTimeString("en-GB", {
      timeZone: "America/Mexico_City",
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    // Resetear el flag después de la hora de cierre (ej. al mediodía)
    if (ahora === "12:00") {
      yaEjecutoHoy = false;
    }

    if (ahora >= HORA_DESACTIVACION && !yaEjecutoHoy) {
      yaEjecutoHoy = true;
      const result = await pool.query(
        "UPDATE usuarios SET status = 'inactivo' WHERE rol = 'practicante' AND status = 'activo'"
      );

      if (result.rowCount > 0) {
        console.log(`🕒 [AUTO-CIERRE] Hora ${ahora}. Se desactivaron ${result.rowCount} practicantes.`);
        await pool.query(
          "INSERT INTO logs_sistema (tipo, descripcion, metadata) VALUES ($1, $2, $3)",
          ['cierre_automatico', `Cierre de las ${HORA_DESACTIVACION} ejecutado`, JSON.stringify({ afectados: result.rowCount })]
        );
      }
    }
  } catch (error) {
    console.error("❌ Error en la desactivación automática:", error.message);
  }
}

function iniciarTareasProgramadas() {
  setInterval(verificarYDesactivarPracticantes, 60000);
}

module.exports = { iniciarTareasProgramadas };
