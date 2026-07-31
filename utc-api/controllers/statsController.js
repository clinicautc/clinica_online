const pool = require('../db');
const statsService = require('../services/statsService');

// Eventos crudos de cancelación/reagendado — citas.estado no puede responder
// esto (cancelar borra la fila; reagendar no cambia el estado), así que
// metricas sigue siendo la única fuente para estos dos. El frontend agrega
// por área/rango de fecha, igual que hace con citas/historiales.
async function getEventos(req, res) {
  try {
    const eventos = await statsService.obtenerEventos(['cita_cancelada', 'cita_reagendada']);
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getLogs(req, res) {
  try {
    const result = await pool.query('SELECT * FROM logs_sistema ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getEventos, getLogs };
