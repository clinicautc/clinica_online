/**
 * ============================================================================
 * ARCHIVO: index.js (Servidor Backend UTC - Versión Master Integrada)
 * PROPÓSITO: API REST para gestión de clínica universitaria
 * CONEXIÓN: PostgreSQL (Render)
 * STATUS: Sincronizado con Triggers de Base de Datos
 * MODIFICACIÓN: Soporte Universal de Asignación (Nutrición y Fisioterapia)
 * ============================================================================
 * 
 * /api/usuarios/forgot-password   → genera y envía código
  /api/usuarios/verify-code       → valida código
  /api/usuarios/reset-password    → cambia contraseña
 */


const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
// --- CONFIGURACIÓN DE RESEND (ENVÍO DE CORREOS) ---
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE POSTGRESQL (RENDER) ---
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } 
});

// --- ALMACENAMIENTO TEMPORAL DE CÓDIGOS recuperacion crea una “memoria temporal---
const recoveryCodes = {};
// ===============================
// CÓDIGOS PARA REGISTRO
// ===============================
const registerCodes = {};

// --- RUTA DE SALUD ---
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: "✅ Conectado a Render", 
      serverTime: result.rows[0],
      database: process.env.DB_NAME 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: USUARIOS Y AUTENTICACIÓN
 * ----------------------------------------------------------------------------
 */

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const result = await pool.query(
      'UPDATE usuarios SET status = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND password = $2',
      [email.trim().toLowerCase(), password]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios/register', async (req, res) => {
  const { nombre, email, password, rol, area } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, area, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [nombre.trim(), email.trim().toLowerCase(), password, rol || 'paciente', area || null, 'activo']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===============================
// ENVIAR CÓDIGO PARA REGISTRO
// ===============================
app.post('/api/usuarios/register-code', async (req, res) => {
  const { email } = req.body;

  try {
    const existing = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Este correo ya está registrado' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    registerCodes[email] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000
    };

    await resend.emails.send({
      from: 'UTC Clínica <noreply@clinicautc.qzz.io>',
      to: [email],
      subject: 'Código de registro',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;">

  <h1 style="color: #1e3a8a; text-align: center;">Clínica UTC</h1>

  <p style="text-align: center; color: #6b7280; font-size: 12px;">
    Sistema de Gestión Clínica
  </p>

  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <h2 style="color: #111827;">Verificación de correo</h2>

  <p style="color: #374151;">
    Recibimos una solicitud para crear una cuenta en Clínica UTC.
  </p>

  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
    <p style="font-size: 14px; color: #6b7280;">Tu código de verificación es:</p>
    <p style="font-size: 28px; font-weight: bold; color: #1e3a8a; letter-spacing: 4px;">
      ${code}
    </p>
  </div>

  <p style="color: #6b7280; font-size: 14px;">
    Este código es temporal, válido por unos minutos y solo puede usarse una vez.
  </p>

  <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
    Si no solicitaste este registro, puedes ignorar este correo.
  </p>

</div>
`
});

    res.json({ message: 'Código enviado' });

  } catch (error) {
    res.status(500).json({ error: 'Error al enviar código' });
  }
});

// ===============================
// VALIDAR CÓDIGO DE REGISTRO
// ===============================
app.post('/api/usuarios/verify-register-code', (req, res) => {
  const { email, code } = req.body;

  const data = registerCodes[email];

  if (!data) {
    return res.status(400).json({ error: 'No hay código para este correo' });
  }

  if (Date.now() > data.expiresAt) {
    delete registerCodes[email];
    return res.status(400).json({ error: 'Código expirado' });
  }

  if (data.code !== code) {
    return res.status(400).json({ error: 'Código incorrecto' });
  }

  delete registerCodes[email];

  return res.json({ valid: true });
});

// ===============================
// RECUPERAR CONTRASEÑA - ENVIAR CÓDIGO
// ===============================
app.post('/api/usuarios/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // 1. Verificar si el usuario existe en la base de datos
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'El correo no está registrado' });
    }

    // 2. Generar código de 6 dígitos
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Guardar código en memoria
  recoveryCodes[email] = {
  code,
  expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutos de validez
  };

    // 4. Enviar correo con Resend
    await resend.emails.send({
      from: 'UTC Clínica <noreply@clinicautc.qzz.io>',
      to: [email],
      subject: 'Recuperación de contraseña',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb;">

  <h1 style="color: #1e3a8a; text-align: center;">Clínica UTC</h1>

  <p style="text-align: center; color: #6b7280; font-size: 12px;">
    Sistema de Gestión Clínica
  </p>

  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;" />

  <h2 style="color: #111827;">Recuperación de contraseña</h2>

  <p style="color: #374151;">
    Recibimos una solicitud para restablecer tu contraseña.
  </p>

  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
    <p style="font-size: 14px; color: #6b7280;">Tu código de verificación es:</p>
    <p style="font-size: 28px; font-weight: bold; color: #1e3a8a; letter-spacing: 4px;">
      ${code}
    </p>
  </div>

  <p style="color: #6b7280; font-size: 14px;">
    Este código es temporal y solo puede usarse una vez.
  </p>

  <p style="color: #9ca3af; font-size: 12px; margin-top: 30px; text-align: center;">
    Si no solicitaste este cambio, puedes ignorar este correo.
  </p>

</div>
`
    });

    console.log(` Código enviado a ${email}: ${code}`);

    res.json({ message: 'Código enviado al correo' });

  } catch (error) {
    console.error(' Error en forgot-password:', error.message);
    res.status(500).json({ error: 'Error al enviar el código' });
  }
});

// ===============================
// VALIDAR CÓDIGO
// ===============================
app.post('/api/usuarios/verify-code', (req, res) => {
  const { email, code } = req.body;

  const data = recoveryCodes[email];

  // No existe código
  if (!data) {
    return res.status(400).json({ error: 'No existe código para este correo' });
  }

  // Código expirado
  if (Date.now() > data.expiresAt) {
    delete recoveryCodes[email];
    return res.status(400).json({ error: 'El código ha expirado' });
  }

  // Código incorrecto
  if (data.code !== code) {
    return res.status(400).json({ error: 'Código incorrecto' });
  }
  // eliminar código usado
  delete recoveryCodes[email];

  // Todo bien
  return res.json({ valid: true });
});

// ===============================
// RESET PASSWORD
// ===============================
app.post('/api/usuarios/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    await pool.query(
      'UPDATE usuarios SET password = $1 WHERE email = $2',
      [newPassword, email]
    );


    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error('❌ Error al actualizar contraseña:', error.message);
    res.status(500).json({ error: 'Error al actualizar contraseña' });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: GESTIÓN DE PRACTICANTES (AUTORIZACIONES)
 * ----------------------------------------------------------------------------
 */

app.get('/api/practicantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM practicantes_autorizados ORDER BY fecha_timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/practicantes', async (req, res) => {
  const { nombre, email, area, estado, fecha_autorizacion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO practicantes_autorizados (nombre, email, area, estado, fecha_autorizacion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre.trim(), email.trim().toLowerCase(), area, estado || 'activo', fecha_autorizacion || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/practicantes/:id', async (req, res) => {
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
});

app.delete('/api/practicantes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM practicantes_autorizados WHERE id = $1', [id]);
    res.json({ message: "Autorización eliminada" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: OPERACIONES CLÍNICAS (CITAS E HISTORIALES MÉDICOS)
 * ----------------------------------------------------------------------------
 */

app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/citas', async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, fecha, hora, estado } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO citas (paciente_id, paciente_nombre, tipo, fecha, hora, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, paciente_nombre, tipo, fecha, hora, estado || 'programada']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- ENDPOINT CORREGIDO: ASIGNACIÓN UNIVERSAL ---
app.patch('/api/citas/:id/asignar', async (req, res) => {
  const { id } = req.params;
  const { practicante_id, practicante_nombre } = req.body;

  try {
    const result = await pool.query(
      `UPDATE citas 
       SET practicante_id = $1, 
           practicante_nombre = $2, 
           estado = 'programada' 
       WHERE id = $3 
       RETURNING *`,
      [practicante_id, practicante_nombre, id]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Cita ${id} asignada a: ${practicante_nombre}`);
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "No se encontró la cita." });
    }
  } catch (error) {
    console.error("❌ Error en DB al asignar:", error.message);
    res.status(500).json({ error: "Error interno: " + error.message });
  }
});

app.get('/api/historiales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historiales_medicos ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/historiales/nutricion', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historiales_nutricion ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/historiales/fisioterapia', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historiales_fisioterapia ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/historiales', async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre, appointment_id } = req.body;
  const tipoLimpio = tipo ? tipo.trim().toLowerCase() : 'medicos';
  let tablaDestino = 'historiales_medicos';
  
  if (tipoLimpio === 'nutricion') tablaDestino = 'historiales_nutricion';
  else if (tipoLimpio === 'fisioterapia') tablaDestino = 'historiales_fisioterapia';

  try {
    const result = await pool.query(
      `INSERT INTO ${tablaDestino} (paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre, appointment_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [paciente_id, paciente_nombre, tipoLimpio, JSON.stringify(datos), creado_por, creado_por_nombre, appointment_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: COMUNICADOS (NOTAS)
 * ----------------------------------------------------------------------------
 */

app.get('/api/notas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notas ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notas', async (req, res) => {
  const { titulo, contenido, destino, creado_por, creado_por_nombre, creado_por_email, destinatario_especifico } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notas (titulo, contenido, destino, creado_por, creado_por_nombre, creado_por_email, destinatario_especifico, fecha_creacion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [titulo, contenido, destino, creado_por, creado_por_nombre || 'Coordinador UTC', creado_por_email, destinatario_especifico || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notas/:id/responder', async (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;
  try {
    const result = await pool.query(
      `UPDATE notas SET respuesta = $1, fecha_respuesta = NOW() WHERE id = $2 RETURNING *`,
      [respuesta, id]
    );
    if (result.rows.length > 0) {
      console.log(`💬 Respuesta registrada para la nota ID: ${id}`);
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "La nota especificada no existe." });
    }
  } catch (error) {
    console.error("❌ Error al registrar respuesta:", error.message);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: INICIO Y EJECUCIÓN DEL SERVIDOR
 * ----------------------------------------------------------------------------
 */

app.get('/', (req, res) => {
  res.send('🚀 Servidor UTC Activo - API de Gestión Clínica funcionando correctamente.');
});

app.listen(PORT, () => {
  console.log(`
  ========================================================
  ✅ API DE LA CLÍNICA UTC EJECUTÁNDOSE EXITOSAMENTE
  🔗 Endpoint Local: http://localhost:${PORT}
  ========================================================
  `);
});