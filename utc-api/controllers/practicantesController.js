const bcrypt = require('bcrypt');
const pool = require('../db');
const { USUARIO_COLUMNAS_SEGURAS } = require('./usuariosController');
const notificationService = require('../services/notificationService');

async function getAll(req, res) {
  try {
    // Incluye practicantes y docentes (admin): ambos viven en "usuarios" y se
    // gestionan desde el mismo módulo de Gestión de Personal.
    const result = await pool.query(`SELECT ${USUARIO_COLUMNAS_SEGURAS} FROM usuarios WHERE rol IN ('practicante', 'admin') ORDER BY fecha_creacion DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function create(req, res) {
  const { tipo, nombre, email, matricula, numero_empleado, area } = req.body;

  // tipo === 'docente' -> rol admin, identificado por numero_empleado.
  // Cualquier otro valor (incluido ausente, para no romper llamadas viejas)
  // conserva el comportamiento original: practicante, identificado por matricula.
  const esDocente = tipo === 'docente';
  const identificador = esDocente ? numero_empleado : matricula;

  // VALIDACIÓN DE IDENTIFICADOR: solo números, máximo 9 dígitos (respaldo del
  // lado del servidor a la validación que ya existe en el formulario).
  if (!/^\d{1,9}$/.test(identificador || '')) {
    return res.status(400).json({
      error: esDocente
        ? 'El número de empleado debe contener solo números (máximo 9 dígitos).'
        : 'La matrícula debe contener solo números (máximo 9 dígitos).'
    });
  }

  const passwordTemporal = `UTC${identificador}`;
  const passwordHash = await bcrypt.hash(passwordTemporal, 10);
  const rol = esDocente ? 'admin' : 'practicante';

  try {
    const emailNormalizado = email.trim().toLowerCase();

    const correoExistente = await pool.query('SELECT id FROM usuarios WHERE email = $1', [emailNormalizado]);
    if (correoExistente.rows.length > 0) {
      return res.status(400).json({ error: 'Este correo ya está registrado.' });
    }

    const columnaIdentificador = esDocente ? 'numero_empleado' : 'matricula';
    const identificadorExistente = await pool.query(
      `SELECT id FROM usuarios WHERE ${columnaIdentificador} = $1`,
      [identificador]
    );
    if (identificadorExistente.rows.length > 0) {
      return res.status(400).json({
        error: esDocente ? 'Este número de empleado ya está registrado.' : 'Esta matrícula ya está registrada.'
      });
    }

    // DETECTAR DOMINIO DEL CORREO
    const dominio = emailNormalizado.split('@')[1];

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
      (nombre, email, password, rol, area, matricula, numero_empleado, status, primer_inicio)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        nombre.trim(),
        emailNormalizado,
        passwordHash,
        rol,
        area,
        esDocente ? null : matricula,
        esDocente ? numero_empleado : null,
        'activo',
        true
      ]
    );

    const { password: _omitPassword, ...creado } = result.rows[0];

    // NOTIFICACIÓN BLOQUEANTE: el practicante o docente necesita sus credenciales
    // para poder acceder al sistema. Si el correo falla, la operación falla.
    await notificationService.notificarCambioPasswordInicial(nombre.trim(), emailNormalizado, passwordTemporal);

    res.status(201).json(creado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAll, create };
