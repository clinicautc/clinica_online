/**
 * ============================================================================
 * ARCHIVO: index.js (Servidor Backend UTC)
 * PROPÓSITO: Bootstrap de la app Express — middlewares globales, montaje de
 * routers y arranque del servidor. La lógica de negocio vive en controllers/,
 * las rutas en routes/, y los servicios (correo, tareas programadas) en services/.
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const usuariosRoutes = require('./routes/usuariosRoutes');
const practicantesRoutes = require('./routes/practicantesRoutes');
const citasRoutes = require('./routes/citasRoutes');
const historialesRoutes = require('./routes/historialesRoutes');
const notasRoutes = require('./routes/notasRoutes');
const recomendacionesRoutes = require('./routes/recomendacionesRoutes');
const statsRoutes = require('./routes/statsRoutes');
const horariosRoutes = require('./routes/horariosRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const horariosAtencionRoutes = require('./routes/horariosAtencionRoutes');

const { iniciarTareasProgramadas } = require('./services/scheduledTasks');

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES GLOBALES ---
// Orígenes permitidos por CORS, configurables por entorno (coma-separados).
// En dev, si no se define CORS_ORIGINS, se permiten los puertos típicos de Vite/CRA en localhost.
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '10mb' }));

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api', usuariosRoutes);
app.use('/api', practicantesRoutes);
app.use('/api', citasRoutes);
app.use('/api', historialesRoutes);
app.use('/api', notasRoutes);
app.use('/api', recomendacionesRoutes);
app.use('/api', statsRoutes);
app.use('/api', horariosRoutes);
app.use('/api', asistenciaRoutes);
app.use('/api', horariosAtencionRoutes);

// --- RUTA DE SALUD (PARA MONITOREO) ---
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({
      status: "✅ Conectado a Render",
      serverTime: result.rows[0],
      database: process.env.DB_NAME
    });
  } catch (error) {
    await pool.query(
      'INSERT INTO logs_sistema (tipo, descripcion) VALUES ($1, $2)',
      ['error_api', `Fallo en health check: ${error.message}`]
    );
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send(' Servidor UTC Activo - API funcionando correctamente.');
});

iniciarTareasProgramadas();

app.listen(PORT, () => {
  console.log(` API DE LA CLÍNICA UTC EJECUTÁNDOSE - PUERTO ${PORT}`);
});
