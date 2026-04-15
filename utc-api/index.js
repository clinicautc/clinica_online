/**
 * ============================================================================
 * ARCHIVO: index.js (Servidor Backend UTC - Versión Flexibilidad Total)
 * PROPÓSITO: API REST para gestión de clínica universitaria
 * CONEXIÓN: PostgreSQL (Render)
 * STATUS: Sincronizado con Triggers de Base de Datos
 * MODIFICACIÓN: Soporte para Comunicación Bidireccional (Emisor/Receptor)
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
 * SECCIÓN: USUARIOS Y AUTENTICACIÓN (DINÁMICA)
 * ----------------------------------------------------------------------------
 */

// Obtener todos los usuarios registrados
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ACTUALIZAR ESTATUS DE USUARIO (Para PractitionerManagement)
app.put('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const result = await pool.query(
      'UPDATE usuarios SET status = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    console.log(`✅ Usuario ${id} actualizado a status: ${estado}`);
    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error en actualización de status:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ELIMINAR USUARIO PERMANENTE (Para PractitionerManagement)
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    console.log(`🗑️ Usuario eliminado permanentemente ID: ${id}`);
    res.json({ message: "Usuario eliminado de la base de datos" });
  } catch (error) {
    console.error("❌ Error al eliminar registro:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// LOGIN: Validación compatible con perfiles pre-autorizados y triggers
app.post('/api/usuarios/login', async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email y contraseña requeridos" });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND password = $2',
      [email.trim().toLowerCase(), password]
    );
    
    if (result.rows.length > 0) {
      console.log(`✅ Sesión iniciada exitosamente: ${email}`);
      res.json(result.rows[0]);
    } else {
      res.status(401).json({ error: 'Credenciales incorrectas o usuario no registrado' });
    }
  } catch (error) {
    console.error("❌ Error en Login:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// REGISTRO FLEXIBLE: El Trigger de PostgreSQL asigna el rol y área automáticamente
app.post('/api/usuarios/register', async (req, res) => {
  const { nombre, email, password, rol, area } = req.body;
  
  try {
    /**
     * IMPORTANTE: El Trigger 'trigger_blindaje_registro' intercepta este INSERT.
     * Valida contra la tabla 'practicantes_autorizados'.
     */
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol, area, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [
        nombre.trim(), 
        email.trim().toLowerCase(), 
        password, 
        rol || 'paciente', 
        area || null,
        'activo'
      ]
    );

    console.log(`👤 Nuevo registro procesado: ${email}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
    } else {
      console.error("❌ Error en Registro:", error.message);
      res.status(500).json({ error: "Error interno al procesar el registro" });
    }
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: GESTIÓN DE PRACTICANTES (PRE-AUTORIZACIÓN / LISTA BLANCA)
 * ----------------------------------------------------------------------------
 */

// Listar practicantes autorizados
app.get('/api/practicantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM practicantes_autorizados ORDER BY fecha_timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Autorizar nuevo practicante (Consola de Administración Master)
app.post('/api/practicantes', async (req, res) => {
  const { nombre, email, area, estado, fecha_autorizacion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO practicantes_autorizados (nombre, email, area, estado, fecha_autorizacion) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [
        nombre.trim(), 
        email.trim().toLowerCase(), 
        area, 
        estado || 'activo', 
        fecha_autorizacion || new Date()
      ]
    );
    console.log(`✅ Pre-autorización guardada para: ${email}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error en Autorización:", error.message);
    res.status(500).json({ error: "Error al registrar en lista blanca" });
  }
});

// Actualizar estado en la lista blanca
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
    console.error("❌ Error en PUT practicantes:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar de la lista blanca
app.delete('/api/practicantes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM practicantes_autorizados WHERE id = $1', [id]);
    console.log(`🗑️ Autorización removida para ID: ${id}`);
    res.json({ message: "Autorización eliminada con éxito" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: OPERACIONES CLÍNICAS (CITAS E HISTORIALES MÉDICOS)
 * ----------------------------------------------------------------------------
 */

// Obtener todas las citas registradas en el sistema
app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener citas:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Crear una nueva cita clínica
app.post('/api/citas', async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, fecha, hora, estado } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO citas (paciente_id, paciente_nombre, tipo, fecha, hora, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, paciente_nombre, tipo, fecha, hora, estado || 'programada']
    );
    console.log(`📅 Cita agendada para: ${paciente_nombre}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al insertar cita:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Listar historiales médicos (Uso de JSONB para flexibilidad)
app.get('/api/historiales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historiales_medicos ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al obtener historiales:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// Guardar nuevo historial clínico detallado (SOPORTE DUAL DINÁMICO)
app.post('/api/historiales', async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre } = req.body;
  
  // DETERMINAR TABLA SEGÚN TIPO
  let tablaDestino = 'historiales_medicos';
  if (tipo === 'nutricion') tablaDestino = 'historiales_nutricion';
  else if (tipo === 'fisioterapia') tablaDestino = 'historiales_fisioterapia';

  try {
    const result = await pool.query(
      `INSERT INTO ${tablaDestino} (paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [paciente_id, paciente_nombre, tipo, JSON.stringify(datos), creado_por, creado_por_nombre]
    );
    console.log(`📄 Historial generado en ${tablaDestino} para: ${paciente_nombre}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(`❌ Error al guardar historial en ${tablaDestino}:`, error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: COMUNICADOS (NOTAS) - ACTUALIZACIÓN COMUNICACIÓN MAESTRA
 * ----------------------------------------------------------------------------
 */

// LEER COMUNICADOS (Para el visor de notas del sistema)
app.get('/api/notas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notas ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error al leer comunicados:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUBLICAR COMUNICADO (NUEVO: Soporte para filtrado de emisor 'creado_por_email')
app.post('/api/notas', async (req, res) => {
  const { 
    titulo, 
    contenido, 
    destino, 
    creado_por, 
    creado_por_nombre, 
    creado_por_email, 
    destinatario_especifico 
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO notas 
       (titulo, contenido, destino, creado_por, creado_por_nombre, creado_por_email, destinatario_especifico, fecha_creacion) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
       RETURNING *`,
      [
        titulo, 
        contenido, 
        destino, 
        creado_por, 
        creado_por_nombre || 'Coordinador UTC', 
        creado_por_email, 
        destinatario_especifico || null
      ]
    );
    console.log(`📣 Comunicado publicado: ${titulo} por ${creado_por_nombre}`);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("❌ Error al publicar comunicado:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// RESPONDER A UN COMUNICADO (NUEVO: Para confirmación de recepción)
app.put('/api/notas/:id/responder', async (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;

  try {
    const result = await pool.query(
      `UPDATE notas 
       SET respuesta = $1, fecha_respuesta = NOW() 
       WHERE id = $2 
       RETURNING *`,
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
    res.status(500).json({ error: "Error interno del servidor al procesar respuesta" });
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
  🛠️  Modo: Gestión Extendida (BI + Comunicación)
  📂 Sincronización PostgreSQL: Activa (Render)
  ========================================================
  `);
});