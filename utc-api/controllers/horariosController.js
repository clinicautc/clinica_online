const pool = require('../db');

async function getByUsuario(req, res) {
  const { usuarioId } = req.params;
  try {
    const result = await pool.query(
      `SELECT dia_semana, hora_inicio, hora_fin, activo
       FROM horarios_practicas
       WHERE usuario_id = $1
       ORDER BY dia_semana`,
      [usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function upsert(req, res) {
  const { usuarioId } = req.params;
  const { dias } = req.body;

  if (!Array.isArray(dias) || dias.length === 0) {
    return res.status(400).json({ error: 'dias debe ser un arreglo no vacío' });
  }

  try {
    const userCheck = await pool.query(
      `SELECT id FROM usuarios WHERE id = $1 AND rol = 'practicante'`,
      [usuarioId]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Practicante no encontrado' });
    }

    for (const dia of dias) {
      await pool.query(
        `INSERT INTO horarios_practicas (usuario_id, dia_semana, hora_inicio, hora_fin, activo)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (usuario_id, dia_semana) DO UPDATE
           SET hora_inicio = EXCLUDED.hora_inicio,
               hora_fin    = EXCLUDED.hora_fin,
               activo      = EXCLUDED.activo`,
        [usuarioId, dia.dia_semana, dia.hora_inicio || null, dia.hora_fin || null, !!dia.activo]
      );
    }

    const result = await pool.query(
      `SELECT dia_semana, hora_inicio, hora_fin, activo
       FROM horarios_practicas WHERE usuario_id = $1 ORDER BY dia_semana`,
      [usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getByUsuario, upsert };
