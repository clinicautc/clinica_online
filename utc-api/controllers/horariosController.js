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
      `SELECT id, area FROM usuarios WHERE id = $1 AND rol = 'practicante'`,
      [usuarioId]
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Practicante no encontrado' });
    }

    // El horario del practicante no puede salirse del horario de atención que
    // el master definió para su área — respaldo del lado del servidor al
    // acotamiento que ya hace el frontend (HorarioPracticas.tsx).
    const area = userCheck.rows[0].area;
    if (area) {
      const { rows: reglas } = await pool.query(
        `SELECT dia_semana, hora_inicio, hora_fin, activo FROM horarios_atencion WHERE area = $1`,
        [area]
      );
      const reglaPorDia = {};
      reglas.forEach(r => { reglaPorDia[r.dia_semana] = r; });

      for (const dia of dias) {
        if (!dia.activo) continue;
        const regla = reglaPorDia[dia.dia_semana];
        if (!regla || !regla.activo) {
          return res.status(400).json({ error: `La clínica no atiende el día ${dia.dia_semana} en el área de ${area}.` });
        }
        const hIni = (dia.hora_inicio || '').substring(0, 5);
        const hFin = (dia.hora_fin || '').substring(0, 5);
        if (hIni < regla.hora_inicio.substring(0, 5) || hFin > regla.hora_fin.substring(0, 5)) {
          return res.status(400).json({
            error: `El horario del día ${dia.dia_semana} debe estar dentro de ${regla.hora_inicio.substring(0, 5)}–${regla.hora_fin.substring(0, 5)}, el horario de atención de ${area}.`
          });
        }
      }
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
