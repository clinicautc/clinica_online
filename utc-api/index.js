/**
 * ============================================================================
 * ARCHIVO: index.js (Servidor Backend UTC - Versión Master de Producción)
 * PROPÓSITO: API REST para gestión de clínica universitaria
 * CONEXIÓN: PostgreSQL (Render)
 * STATUS: Sincronizado con Dashboards de Nutrición y Fisioterapia
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN DE POSTGRESQL ---
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// MEMORIA TEMPORAL PARA CÓDIGOS (En producción usar Redis, para el proyecto esto es perfecto)
const recoveryCodes = {};
const registerCodes = {};

// --- RUTA DE SALUD ---
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: "✅ Conexión con PostgreSQL Activa",
      serverTime: result.rows[0],
      database: process.env.DB_NAME
    });
  } catch (error) {
    res.status(500).json({ error: "Fallo de conexión a la DB" });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: USUARIOS Y AUTENTICACIÓN
 * ----------------------------------------------------------------------------
 */

app.get('/api/usuarios', async (req, res) => {
  try {
    // Sincronizado con el frontend: enviamos nombre, email, rol, area y estado
    const result = await pool.query('SELECT id, nombre, email, rol, area, status as estado FROM usuarios ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
        'SELECT id, nombre, email, rol, area, status as estado FROM usuarios WHERE email = $1 AND password = $2',
        [email.trim().toLowerCase(), password]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: 'Correo o contraseña incorrectos' });
    }
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post('/api/usuarios/register', async (req, res) => {
  const { nombre, email, password, rol, area } = req.body;
  try {
    const result = await pool.query(
        'INSERT INTO usuarios (nombre, email, password, rol, area, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, nombre, email, rol, area, status as estado',
        [nombre.trim(), email.trim().toLowerCase(), password, rol || 'paciente', area || null, 'activo']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error al registrar usuario. El correo podría ya existir." });
  }
});

// --- LÓGICA DE RECUPERACIÓN DE CONTRASEÑA ---
app.post('/api/usuarios/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Correo no registrado' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryCodes[email] = { code, expiresAt: Date.now() + 5 * 60 * 1000 };

    await resend.emails.send({
      from: 'Clínica UTC <noreply@clinicautc.qzz.io>',
      to: [email],
      subject: '🔑 Código de Recuperación - UTC',
      html: `<h1>Código: ${code}</h1><p>Válido por 5 minutos.</p>`
    });
    res.json({ message: 'Código enviado' });
  } catch (error) { res.status(500).json({ error: 'Error al enviar email' }); }
});

app.post('/api/usuarios/verify-code', (req, res) => {
  const { email, code } = req.body;
  const data = recoveryCodes[email];
  if (!data || Date.now() > data.expiresAt || data.code !== code) {
    return res.status(400).json({ error: 'Código inválido o expirado' });
  }
  delete recoveryCodes[email];
  res.json({ valid: true });
});

app.post('/api/usuarios/reset-password', async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    await pool.query('UPDATE usuarios SET password = $1 WHERE email = $2', [newPassword, email]);
    res.json({ message: 'Contraseña actualizada' });
  } catch (error) { res.status(500).json({ error: 'Error en la base de datos' }); }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: CITAS
 * ----------------------------------------------------------------------------
 */

app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citas ORDER BY fecha ASC, hora ASC');
    res.json(result.rows);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.patch('/api/citas/:id/asignar', async (req, res) => {
  const { id } = req.params;
  const { practicante_id, practicante_nombre } = req.body;
  try {
    const result = await pool.query(
        "UPDATE citas SET practicante_id = $1, practicante_nombre = $2, estado = 'asignada' WHERE id = $3 RETURNING *",
        [practicante_id, practicante_nombre, id]
    );
    res.json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error en asignación" }); }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: HISTORIALES CLÍNICOS (LÓGICA UNIFICADA)
 * ----------------------------------------------------------------------------
 */

// Este endpoint es el que el frontend usa para "Buscar si ya existe un historial"
app.get('/api/historiales', async (req, res) => {
  try {
    // ¡AQUÍ AGREGAMOS fecha_creacion AL SELECT!
    const fisio = await pool.query("SELECT id, paciente_id, paciente_nombre, 'fisioterapia' as tipo, datos, appointment_id, fecha_creacion FROM historiales_fisioterapia");
    const nutri = await pool.query("SELECT id, paciente_id, paciente_nombre, 'nutricion' as tipo, datos, appointment_id, fecha_creacion FROM historiales_nutricion");
    
    res.json([...fisio.rows, ...nutri.rows]);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener historiales unificados" });
  }
});

app.post('/api/historiales', async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, datos, creado_por, appointment_id } = req.body;

  // Determinamos a qué tabla debe ir según el tipo
  let tabla = 'historiales_medicos'; // Fallback
  if (tipo === 'fisioterapia') tabla = 'historiales_fisioterapia';
  if (tipo === 'nutricion') tabla = 'historiales_nutricion';

  try {
    const result = await pool.query(
        `INSERT INTO ${tabla} (paciente_id, paciente_nombre, tipo, datos, creado_por, appointment_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [paciente_id, paciente_nombre, tipo, JSON.stringify(datos), creado_por, appointment_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al guardar historial:", error.message);
    res.status(500).json({ error: "Error de servidor al guardar el historial clínico" });
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
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/notas', async (req, res) => {
  const { titulo, contenido, destino, creado_por, creado_por_nombre, destinatario_especifico } = req.body;
  try {
    const result = await pool.query(
        `INSERT INTO notas (titulo, contenido, destino, creado_por, creado_por_nombre, destinatario_especifico, fecha_creacion) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [titulo, contenido, destino, creado_por, creado_por_nombre, destinatario_especifico || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) { res.status(500).json({ error: "Error al publicar nota" }); }
});

// --- ELIMINAR NOTA ---
app.delete('/api/notas/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notas WHERE id = $1', [req.params.id]);
    res.json({ message: "Nota eliminada" });
  } catch (error) { res.status(500).json({ error: "Error al eliminar" }); }
});

// --- INICIO DEL SERVIDOR ---
app.get('/', (req, res) => res.send('🚀 Servidor UTC Activo'));

app.listen(PORT, () => {
  console.log(`✅ API Clínica UTC corriendo en http://localhost:${PORT}`);
});