const pool = require('../db');

// Punto único de acceso a la tabla metricas para el módulo de estadísticas.
// Devuelve eventos crudos (sin agregar) — el llamador filtra por área/rango
// de fecha, igual que ya se hace con citas/historiales en el frontend.
//
// Una futura capa de IA (resúmenes, detección de tendencias/anomalías) debería
// consumir esta función en vez de escribir SQL nueva contra metricas.
async function obtenerEventos(tipos) {
  const { rows } = await pool.query(
    `SELECT tipo_evento, area, practicante_id, fecha_registro
       FROM metricas
      WHERE tipo_evento = ANY($1::text[])
      ORDER BY fecha_registro DESC`,
    [tipos]
  );
  return rows;
}

module.exports = { obtenerEventos };
