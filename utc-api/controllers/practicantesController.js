const bcrypt = require('bcrypt');
const pool = require('../db');
const { USUARIO_COLUMNAS_SEGURAS } = require('./usuariosController');

async function getAll(req, res) {
  try {
    const result = await pool.query(`SELECT ${USUARIO_COLUMNAS_SEGURAS} FROM usuarios WHERE rol = 'practicante' ORDER BY fecha_creacion DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  const { nombre, email, matricula, area, estado, fecha_autorizacion } = req.body;

  const passwordTemporal = `UTC${matricula}`;
  const passwordHash = await bcrypt.hash(passwordTemporal, 10);

  try {
    // DETECTAR DOMINIO DEL CORREO
    const dominio = email.trim().toLowerCase().split('@')[1];

    const dominiosPublicos = [
      'gmail.com', 'hotmail.com', 'outlook.com', 'live.com',
      'yahoo.com', 'icloud.com', 'proton.me', 'protonmail.com'
    ];

    if (!dominiosPublicos.includes(dominio)) {
      const dominioExistente = await pool.query('SELECT * FROM correos_especiales WHERE dominio = $1', [dominio]);

      if (dominioExistente.rows.length === 0) {
        await pool.query(
          'INSERT INTO correos_especiales (dominio, proveedor, origen) VALUES ($1, $2, $3)',
          [dominio, 'nodemailer', 'alta_practicante']
        );
      }
    }

    const result = await pool.query(
      `INSERT INTO usuarios
      (nombre, email, password, rol, area, matricula, status, primer_inicio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [nombre.trim(), email.trim().toLowerCase(), passwordHash, 'practicante', area, matricula, 'activo', true]
    );

    const { password: _omitPassword, ...practicanteCreado } = result.rows[0];
    res.status(201).json(practicanteCreado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const result = await pool.query(
      'UPDATE practicantes_autorizados SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAll, create, updateStatus };
