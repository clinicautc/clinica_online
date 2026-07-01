const pool = require('../db');
const { reasignarCitasPorAusencia } = require('../services/asignacionService');
const notificationService = require('../services/notificationService');

async function getByFecha(req, res) {
  const { fecha, area } = req.query;
  if (!fecha) return res.status(400).json({ error: 'fecha requerida (YYYY-MM-DD)' });

  try {
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.area, u.status,
              COALESCE(a.estado, 'sin_registro') AS asistencia
       FROM usuarios u
       LEFT JOIN asistencia_practicantes a
              ON a.usuario_id = u.id AND a.fecha = $1
       WHERE u.rol = 'practicante'
         AND ($2::text IS NULL OR u.area = $2)
       ORDER BY u.nombre`,
      [fecha, area || null]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function registrar(req, res) {
  const { fecha, registros } = req.body;

  if (!fecha || !Array.isArray(registros) || registros.length === 0) {
    return res.status(400).json({ error: 'fecha y registros[] requeridos' });
  }

  const registradoPor = req.user.id;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const r of registros) {
      await client.query(
        `INSERT INTO asistencia_practicantes (usuario_id, fecha, estado, registrado_por)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (usuario_id, fecha) DO UPDATE
           SET estado = EXCLUDED.estado, registrado_por = EXCLUDED.registrado_por`,
        [r.usuario_id, fecha, r.estado, registradoPor]
      );

      const nuevoStatus = r.estado === 'presente' ? 'activo' : 'inactivo';
      await client.query(
        `UPDATE usuarios SET status = $1 WHERE id = $2`,
        [nuevoStatus, r.usuario_id]
      );
    }

    await client.query('COMMIT');

    // Reasignación automática para practicantes marcados como ausentes
    const ausentes = registros.filter(r => r.estado === 'ausente');
    let totalReasignadas = 0;
    let totalPendientes = 0;

    for (const r of ausentes) {
      try {
        const { rows: uRows } = await pool.query(
          'SELECT area FROM usuarios WHERE id = $1', [r.usuario_id]
        );
        if (uRows.length === 0) continue;
        const resultados = await reasignarCitasPorAusencia(r.usuario_id, fecha, uRows[0].area);

        for (const reasignacion of resultados) {
          if (reasignacion.resultado === 'reasignada') {
            totalReasignadas++;
            try {
              const emailResult = await pool.query(
                'SELECT email FROM usuarios WHERE id = $1', [reasignacion.pacienteId]
              );
              if (emailResult.rows.length > 0) {
                notificationService.notificarReasignacion(
                  reasignacion.pacienteNombre, emailResult.rows[0].email,
                  fecha, reasignacion.hora, reasignacion.nuevoPracticante.nombre
                );
              }
            } catch (notifErr) {
              console.error('[asistencia] Error al consultar email para notificación:', notifErr.message);
            }
          } else if (reasignacion.resultado === 'pendiente_reprogramacion') {
            totalPendientes++;
          }
        }
      } catch (reasignErr) {
        console.error('[asistencia] Error en reasignación:', reasignErr.message);
      }
    }

    res.json({
      message: `Asistencia del ${fecha} registrada.`,
      total: registros.length,
      reasignaciones: { reasignadas: totalReasignadas, pendientes: totalPendientes },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

async function getByPracticante(req, res) {
  const { usuarioId } = req.params;
  try {
    const result = await pool.query(
      `SELECT fecha, estado, created_at
       FROM asistencia_practicantes
       WHERE usuario_id = $1
       ORDER BY fecha DESC
       LIMIT 60`,
      [usuarioId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getByMes(req, res) {
  const { mes, area } = req.query;
  if (!mes || !/^\d{4}-\d{2}$/.test(mes)) {
    return res.status(400).json({ error: 'Parámetro mes inválido (yyyy-MM)' });
  }
  const inicio = `${mes}-01`;
  let sql = `
    SELECT
      to_char(a.fecha, 'YYYY-MM-DD') AS fecha,
      u.id, u.nombre, u.area, a.estado
    FROM asistencia_practicantes a
    JOIN usuarios u ON u.id = a.usuario_id
    WHERE a.fecha >= $1::date
      AND a.fecha < ($1::date + INTERVAL '1 month')
      AND u.rol = 'practicante'
  `;
  const params = [inicio];
  if (area) { sql += ` AND u.area = $${params.length + 1}`; params.push(area); }
  sql += ' ORDER BY a.fecha DESC, u.nombre';
  try {
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getByFecha, registrar, getByPracticante, getByMes };
