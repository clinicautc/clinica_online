const pool = require('../db');

const USUARIO_COLUMNAS_SEGURAS = 'id, nombre, email, rol, area, status, telefono, matricula, numero_empleado, primer_inicio, fecha_creacion';

async function getAll(req, res) {
  try {
    const result = await pool.query(`SELECT ${USUARIO_COLUMNAS_SEGURAS} FROM usuarios ORDER BY fecha_creacion DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT ${USUARIO_COLUMNAS_SEGURAS} FROM usuarios WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ENDPOINT DEFINITIVO: ACTUALIZAR PERFIL (NOMBRE, TELÉFONO Y MATRÍCULA)
async function updateProfile(req, res) {
  const { id } = req.params;
  const { nombre, telefono, matricula } = req.body;

  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No tienes autorización para modificar este perfil.' });
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET nombre = COALESCE($1, nombre),
           telefono = COALESCE($2, telefono),
           matricula = COALESCE($3, matricula)
       WHERE id = $4
       RETURNING id, nombre, telefono, matricula, email, rol, area, status`,
      [nombre, telefono, matricula, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.json({
      message: 'Perfil actualizado correctamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('❌ Error interno en PATCH usuarios:', error.message);
    return res.status(500).json({
      error: 'Error en la base de datos al procesar la solicitud',
      details: error.message
    });
  }
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const result = await pool.query('UPDATE usuarios SET status = $1 WHERE id = $2 RETURNING *', [estado, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const { password: _omitPassword, ...usuarioActualizado } = result.rows[0];
    res.json(usuarioActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  USUARIO_COLUMNAS_SEGURAS,
  getAll,
  getById,
  updateProfile,
  updateStatus,
  remove
};
