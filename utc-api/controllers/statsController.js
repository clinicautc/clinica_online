const pool = require('../db');

async function getDashboard(req, res) {
  try {
    const total = await pool.query("SELECT COUNT(*) FROM citas");
    const completadas = await pool.query("SELECT COUNT(*) FROM citas WHERE estado = 'completada'");
    const programadas = await pool.query("SELECT COUNT(*) FROM citas WHERE estado = 'programada'");
    const canceladasMetrica = await pool.query("SELECT COUNT(*) FROM metricas WHERE tipo_evento = 'cita_cancelada'");
    const reagendadasMetrica = await pool.query("SELECT COUNT(*) FROM metricas WHERE tipo_evento = 'cita_reagendada'");
    const promedioConsultaMetrica = await pool.query("SELECT AVG(valor_numerico) FROM metricas WHERE tipo_evento = 'tiempo_consulta'");

    res.json({
      totalCitas: parseInt(total.rows[0].count),
      citasCompletadas: parseInt(completadas.rows[0].count),
      citasCanceladas: parseInt(canceladasMetrica.rows[0].count),
      citasProgramadas: parseInt(programadas.rows[0].count),
      reagendadas: parseInt(reagendadasMetrica.rows[0].count),
      promedioConsulta: Math.round(promedioConsultaMetrica.rows[0].avg || 0),
      timestamp: new Date()
    });
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

module.exports = { getDashboard, getLogs };
