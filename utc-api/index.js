/**
 * ============================================================================
 * ARCHIVO: index.js (Servidor Backend UTC - Versión Master Integrada)
 * PROPÓSITO: API REST para gestión de clínica universitaria
 * CONEXIÓN: PostgreSQL (Render)
 * STATUS: Sincronizado con Triggers de Base de Datos
 * MODIFICACIÓN: Soporte Universal de Asignación (Nutrición y Fisioterapia)
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

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