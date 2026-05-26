// --- authRoutes.js ---

const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();
const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

router.post('/login', async (req, res) => {
      const { email, password } = req.body;
    
      try {
    
        const result = await pool.query(
          'SELECT * FROM usuarios WHERE email = $1',
          [email.trim().toLowerCase()]
        );
    
        if (result.rows.length === 0) {
          return res.status(401).json({
            error: 'Credenciales incorrectas'
          });
        }
    
        const usuario = result.rows[0];
    
        // =========================
        // PASSWORD VIEJA (texto plano)
        // =========================
    if (usuario.password === password) {
    
      // =========================
      // MIGRAR A BCRYPT AUTOMÁTICAMENTE
      // =========================
    
      const nuevaHash = await bcrypt.hash(password, 10);
    
      await pool.query(
        'UPDATE usuarios SET password = $1 WHERE id = $2',
        [nuevaHash, usuario.id]
      );
    
      console.log(
        ` Password migrada automáticamente: ${usuario.email}`
      );
    
      return res.json(usuario);
    }
    
        // =========================
        // PASSWORD NUEVA (bcrypt)
        // =========================
        const passwordCorrecta = await bcrypt.compare(
          password,
          usuario.password
        );
    
        if (!passwordCorrecta) {
          return res.status(401).json({
            error: 'Credenciales incorrectas'
          });
        }
    
        // =========================
        // USUARIO INACTIVO
        // =========================
        if (usuario.status === 'inactivo') {
    
          return res.status(403).json({
            error: 'Tu cuenta se encuentra inactiva.'
          });
        }
    
        res.json(usuario);
    
      } catch (error) {
    
        console.error('Error login:', error.message);
    
        res.status(500).json({
          error: 'Error interno del servidor'
        });
      }

});

router.get('/validate-session', async (req, res) => {

  try {

    const email = req.headers.email;

    if (!email) {
      return res.status(401).json({
        valid: false
      });
    }

    const result = await pool.query(
      'SELECT id, nombre, email, rol, area, status AS estado FROM usuarios WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        valid: false
      });
    }

    const usuario = result.rows[0];

    if (usuario.estado === 'inactivo') {
      return res.status(403).json({
        valid: false
      });
    }

    res.json({
      valid: true,
      user: usuario
    });

  } catch (error) {

    console.error(
      'Error validando sesión:',
      error.message
    );

    res.status(500).json({
      valid: false
    });
  }
});
module.exports = router;
