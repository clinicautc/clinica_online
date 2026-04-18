/// <reference types="vite/client" />
/**
 * ============================================================================
 * ARCHIVO: database.config.ts
 * PROPÓSITO: Configuración para PostgreSQL en Render + pgAdmin4
 * UBICACIÓN: src/app/lib/database.config.ts
 * ============================================================================
 *
 * Este archivo contiene toda la configuración necesaria para conectar
 * la aplicación UTC a una base de datos PostgreSQL alojada en Render.com
 */

/**
 * INTERFAZ: DatabaseConfig
 * Define la estructura de la configuración de base de datos
 */
export interface DatabaseConfig {
  host: string;          // Dirección del servidor (ej: dpg-xxx.oregon-postgres.render.com)
  port: number;          // Puerto (generalmente 5432 para PostgreSQL)
  database: string;      // Nombre de la base de datos
  user: string;          // Usuario de la base de datos
  password: string;      // Contraseña del usuario
  ssl: boolean;          // Si usar SSL/TLS (true en Render)
}

/**
 * CONFIGURACIÓN DE BASE DE DATOS
 *
 * estas variables vienen del archivo .env
 * 
 */
export const databaseConfig: DatabaseConfig = {
  host: import.meta.env.VITE_DB_HOST || 'localhost',
  port: parseInt(import.meta.env.VITE_DB_PORT || '5432'),
  database: import.meta.env.VITE_DB_NAME || 'utc_clinica',
  user: import.meta.env.VITE_DB_USER || 'postgres',
  password: import.meta.env.VITE_DB_PASSWORD || '',
  ssl: import.meta.env.VITE_DB_SSL === 'true',
};

/**
 * ============================================================================
 * ESQUEMA SQL DE LA BASE DE DATOS
 * ============================================================================
 *
 * INSTRUCCIONES:
 * 1. Abre pgAdmin4 o el Dashboard de Render
 * 2. Conecta a tu base de datos PostgreSQL
 * 3. Ejecuta el siguiente script SQL para crear todas las tablas
 */

export const SQL_SCHEMA = `
-- ============================================================================
-- TABLA: usuarios
-- Almacena todos los usuarios del sistema (pacientes, practicantes, admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('paciente', 'practicante', 'admin')),
  area VARCHAR(50) CHECK (area IN ('nutricion', 'fisioterapia') OR area IS NULL),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: citas
-- Almacena todas las citas médicas programadas
-- ============================================================================
CREATE TABLE IF NOT EXISTS citas (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  paciente_nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nutricion', 'fisioterapia')),
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  estado VARCHAR(50) NOT NULL CHECK (estado IN ('programada', 'completada', 'cancelada')),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: historiales_medicos
-- Almacena las evaluaciones médicas (formularios completados)
-- ============================================================================
CREATE TABLE IF NOT EXISTS historiales_medicos (
  id SERIAL PRIMARY KEY,
  paciente_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  paciente_nombre VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('nutricion', 'fisioterapia')),
  datos JSONB NOT NULL,  -- JSONB permite almacenar el formulario completo de forma flexible
  creado_por INTEGER REFERENCES usuarios(id),
  creado_por_nombre VARCHAR(255),
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: notas_universitarias
-- Almacena las notas publicadas por administradores para practicantes
-- ============================================================================
CREATE TABLE IF NOT EXISTS notas_universitarias (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  contenido TEXT NOT NULL,
  categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('general', 'nutricion', 'fisioterapia')),
  creado_por INTEGER REFERENCES usuarios(id),
  creado_por_nombre VARCHAR(255),
  fecha_creacion DATE NOT NULL,
  fecha_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLA: practicantes_autorizados
-- Almacena los practicantes que tienen acceso al sistema
-- ============================================================================
CREATE TABLE IF NOT EXISTS practicantes_autorizados (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  area VARCHAR(50) NOT NULL CHECK (area IN ('nutricion', 'fisioterapia')),
  estado VARCHAR(50) NOT NULL CHECK (estado IN ('activo', 'inactivo')),
  fecha_autorizacion DATE NOT NULL,
  fecha_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÍNDICES para mejorar el rendimiento de las consultas
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_citas_fecha ON citas(fecha);
CREATE INDEX IF NOT EXISTS idx_citas_paciente ON citas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_citas_tipo ON citas(tipo);
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado);

CREATE INDEX IF NOT EXISTS idx_historiales_paciente ON historiales_medicos(paciente_id);
CREATE INDEX IF NOT EXISTS idx_historiales_tipo ON historiales_medicos(tipo);
CREATE INDEX IF NOT EXISTS idx_historiales_fecha ON historiales_medicos(fecha_creacion);

CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

CREATE INDEX IF NOT EXISTS idx_notas_categoria ON notas_universitarias(categoria);
CREATE INDEX IF NOT EXISTS idx_notas_fecha ON notas_universitarias(fecha_creacion);

-- ============================================================================
-- DATOS DE EJEMPLO (usuarios de prueba)
-- ============================================================================
INSERT INTO usuarios (nombre, email, password, rol, area) VALUES
  ('Dr. Carlos Administrador', 'admin1@utc.edu.mx', 'admin123', 'admin', NULL),
  ('Dra. María González', 'admin2@utc.edu.mx', 'admin123', 'admin', NULL),
  ('Estudiante Ana Nutrición', 'practicante1@utc.edu.mx', 'prac123', 'practicante', 'nutricion'),
  ('Estudiante Luis Fisioterapia', 'practicante2@utc.edu.mx', 'prac123', 'practicante', 'fisioterapia'),
  ('Juan Pérez García', 'paciente1@gmail.com', 'pac123', 'paciente', NULL),
  ('María López Hernández', 'paciente2@gmail.com', 'pac123', 'paciente', NULL),
  ('Pedro Ramírez Torres', 'paciente3@gmail.com', 'pac123', 'paciente', NULL)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- FIN DEL SCHEMA
-- ============================================================================
`;

/**
 * ============================================================================
 * EJEMPLO DE API CON EXPRESS.JS
 * ============================================================================
 *
 * Crea un backend separado en Node.js + Express para conectar PostgreSQL:
 *
 * ESTRUCTURA DEL PROYECTO API:
 * utc-api/
 * ├── package.json
 * ├── .env
 * ├── index.js
 * └── routes/
 *     ├── usuarios.js
 *     ├── citas.js
 *     ├── historiales.js
 *     └── notas.js
 *
 * ARCHIVO: index.js
 */

export const EXAMPLE_API_CODE = `
// ============================================================================
// ARCHIVO: index.js (Backend Express)
// ============================================================================

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

// ============================================================================
// RUTAS: Usuarios
// ============================================================================

// GET /api/usuarios - Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/usuarios/login - Iniciar sesión
app.post('/api/usuarios/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND password = $2',
      [email, password]
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

// POST /api/usuarios/register - Registrar nuevo usuario
app.post('/api/usuarios/register', async (req, res) => {
  const { nombre, email, password } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, email, password, 'paciente']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Email duplicado
      res.status(400).json({ error: 'El correo ya está registrado' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// ============================================================================
// RUTAS: Citas
// ============================================================================

// GET /api/citas - Obtener todas las citas
app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/citas - Crear nueva cita
app.post('/api/citas', async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, fecha, hora, estado } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO citas (paciente_id, paciente_nombre, tipo, fecha, hora, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, paciente_nombre, tipo, fecha, hora, estado]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/citas/:id - Actualizar estado de cita
app.put('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  try {
    const result = await pool.query(
      'UPDATE citas SET estado = $1 WHERE id = $2 RETURNING *',
      [estado, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/citas/:id - Eliminar cita
app.delete('/api/citas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM citas WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTAS: Historiales Médicos
// ============================================================================

// GET /api/historiales - Obtener todos los historiales
app.get('/api/historiales', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historiales_medicos ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/historiales - Crear nuevo historial
app.post('/api/historiales', async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO historiales_medicos (paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, paciente_nombre, tipo, JSON.stringify(datos), creado_por, creado_por_nombre]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTAS: Notas Universitarias
// ============================================================================

// GET /api/notas - Obtener todas las notas
app.get('/api/notas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notas_universitarias ORDER BY fecha_timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notas - Crear nueva nota
app.post('/api/notas', async (req, res) => {
  const { titulo, contenido, categoria, creado_por, creado_por_nombre, fecha_creacion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO notas_universitarias (titulo, contenido, categoria, creado_por, creado_por_nombre, fecha_creacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [titulo, contenido, categoria, creado_por, creado_por_nombre, fecha_creacion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notas/:id - Eliminar nota
app.delete('/api/notas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM notas_universitarias WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// RUTAS: Practicantes
// ============================================================================

// GET /api/practicantes - Obtener todos los practicantes
app.get('/api/practicantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM practicantes_autorizados ORDER BY fecha_timestamp DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/practicantes - Agregar nuevo practicante
app.post('/api/practicantes', async (req, res) => {
  const { usuario_id, nombre, email, area, estado, fecha_autorizacion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO practicantes_autorizados (usuario_id, nombre, email, area, estado, fecha_autorizacion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [usuario_id, nombre, email, area, estado, fecha_autorizacion]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/practicantes/:id - Cambiar estado de practicante
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

// DELETE /api/practicantes/:id - Eliminar practicante
app.delete('/api/practicantes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM practicantes_autorizados WHERE id = $1', [id]);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Iniciar servidor
// ============================================================================

app.listen(PORT, () => {
  console.log(\`✅ API UTC ejecutándose en http://localhost:\${PORT}\`);
});
`;

/**
 * ============================================================================
 * INSTRUCCIONES PARA MIGRAR DE LOCALSTORAGE A POSTGRESQL
 * ============================================================================
 *
 * 1. CREAR EL BACKEND:
 *    - Crea carpeta separada "utc-api"
 *    - npm install express pg cors dotenv
 *    - Copia el código de EXAMPLE_API_CODE a index.js
 *    - Crea archivo .env con credenciales de Render
 *    - Ejecuta: node index.js
 *
 * 2. MODIFICAR EL FRONTEND:
 *    - En cada componente que usa localStorage
 *    - Reemplaza con llamadas fetch() a la API
 *    - Ejemplo:
 *
 *      // ANTES
 *      const citas = JSON.parse(localStorage.getItem('utc_appointments') || '[]');
 *
 *      // DESPUÉS
 *      const response = await fetch('http://localhost:3001/api/citas');
 *      const citas = await response.json();
 *
 * 3. DEPLOY:
 *    - Deploy backend en Render.com (Web Service)
 *    - Deploy frontend en Render.com (Static Site)
 *    - Actualiza las URLs de fetch() para apuntar a tu API en producción
 *
 * ============================================================================
 */

export default databaseConfig;
