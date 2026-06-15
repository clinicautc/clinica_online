/**
 * ============================================================================
 * ARCHIVO: index.js (Servidor Backend UTC - Versión Master con Estadísticas)
 * PROPÓSITO: API REST para gestión de clínica universitaria
 * CONEXIÓN: PostgreSQL (Render)
 * STATUS: Sincronizado con Triggers y Métricas de Inteligencia Operativa
 * MODIFICACIÓN: Auto-completado de citas al guardar historial y soporte al visor.
 * ============================================================================
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();
const { Resend } = require('resend');
const bcrypt = require('bcrypt');
const authRoutes = require('./routes/authRoutes');

const {requireAuth,requireRole,requireSameArea,canModifyAppointment} = require('./middleware/authMiddleware');

const resend = new Resend(process.env.RESEND_API_KEY);
const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

// --- CONFIGURACIÓN DE POSTGRESQL (RENDER) ---
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false } 
});

// --- RUTA DE SALUD (ACTUALIZADA PARA MONITOREO) ---
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


/**
 * ----------------------------------------------------------------------------
 * ENDPOINT: PRE-REGISTRO Y ENVÍO DE CÓDIGO (Blindado)
 * ----------------------------------------------------------------------------
 */
app.post('/api/auth/pre-register', async (req, res) => {
   console.log('🚨 PRE-REGISTER EJECUTADO');
  const { name, email, password } = req.body;
  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
// =========================
// VERIFICAR SI EMAIL YA EXISTE
// =========================

const existingUser = await pool.query(
  'SELECT id FROM usuarios WHERE email = $1',
  [email.trim().toLowerCase()]
);

if (existingUser.rows.length > 0) {

  return res.status(400).json({
    error: 'Este correo ya está registrado.'
  });
}
    // PASO 1: Inserción en la tabla de retención (Ya verificada)
    await pool.query(
      `INSERT INTO registro_temporal (nombre, email, password_hash, codigo_verificacion, expira_en) 
       VALUES ($1, $2, $3, $4, NOW() + interval '15 minutes')
       ON CONFLICT (email) DO UPDATE SET 
       nombre = $1, password_hash = $3, codigo_verificacion = $4, expira_en = NOW() + interval '15 minutes'`,
      [name, email.trim().toLowerCase(), hashedPassword, codigo]
    );

    // PASO 2: Envío por Resend con manejo de errores específico
    const { data, error } = await resend.emails.send({
      from: 'Clinica UTC <notificaciones@clinicautc.com>',
      to: [email.trim().toLowerCase()],
      subject: 'Código de Verificación - Clínica UTC',
html: `
<div style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 10px;background:#ffffff;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" style="
          max-width:600px;
          background:#ffffff;
          border-radius:18px;
          overflow:hidden;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
          border:1px solid #e5e7eb;
        ">

          <!-- HEADER -->
          <tr>
            <td align="center" style="
              background:linear-gradient(135deg,#dbeafe,#eff6ff);
              padding:35px 20px;
            ">

              <h1 style="
                margin:0;
                font-size:34px;
                font-weight:900;
                color:#1e3a8a;
              ">
                Clínica UTC
              </h1>

              <p style="
                margin-top:10px;
                font-size:14px;
                color:#475569;
              ">
                Sistema Clínico Universitario
              </p>

            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:35px 25px;">

              <h2 style="
                margin-top:0;
                color:#111827;
                font-size:28px;
                line-height:1.3;
              ">
                Hola, ${name} 👋
              </h2>

              <p style="
                color:#4b5563;
                font-size:16px;
                line-height:1.8;
                margin-bottom:30px;
              ">
                Recibimos una solicitud para crear una cuenta dentro del sistema clínico de la Universidad Tres Culturas (UTC).
              </p>

              <!-- CAJA CODIGO -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">

                    <div style="
                      background:#eff6ff;
                      border:2px solid #2563eb;
                      border-radius:18px;
                      padding:30px 15px;
                    ">

                      <p style="
                        margin:0;
                        color:#64748b;
                        font-size:14px;
                      ">
                        Tu código de verificación es:
                      </p>

                      <div style="
                        margin-top:15px;
                        font-size:48px;
                        font-weight:900;
                        letter-spacing:10px;
                        color:#1e3a8a;
                        line-height:1.1;
                        word-break:break-word;
                      ">
                        ${codigo}
                      </div>

                    </div>

                  </td>
                </tr>
              </table>

              <p style="
                color:#6b7280;
                font-size:14px;
                line-height:1.7;
                margin-top:30px;
              ">
                Este código expirará en 15 minutos por motivos de seguridad.
              </p>

              <p style="
                color:#6b7280;
                font-size:14px;
                line-height:1.7;
              ">
                Si tú no realizaste esta solicitud, puedes ignorar este correo.
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" style="
              background:#ffffff;
              border-top:1px solid #e5e7eb;
              padding:20px;
            ">

              <p style="
                margin:0;
                color:#94a3b8;
                font-size:12px;
              ">
                Clínica UTC · Sistema Institucional
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</div>
`
    });

    // Si Resend falla por el tema del correo no autorizado
    if (error) {
      console.error("⚠️ Resend bloqueó el envío:", error.message);
      return res.status(403).json({ 
        error: "Restricción de Resend: Solo puedes enviar códigos al correo registrado en la API Key mientras estés en modo prueba." 
      });
    }

    res.status(200).json({ message: "Código enviado con éxito." });
  } catch (error) {
    console.error("❌ Error interno en Pre-Registro:", error.message);
    res.status(500).json({ error: "Error en el servidor al procesar el registro." });
  }
});

/**
 * ----------------------------------------------------------------------------
 * ENDPOINT: VALIDACIÓN Y REGISTRO DEFINITIVO
 * Lógica: Verifica el código y mueve al usuario a la tabla principal.
 * ----------------------------------------------------------------------------
 */
app.post('/api/auth/verify-and-register', async (req, res) => {
  const { email, code } = req.body;

  try {
    // 1. Buscamos en la tabla de retención
    const tempUser = await pool.query(
      "SELECT * FROM registro_temporal WHERE email = $1 AND codigo_verificacion = $2 AND expira_en > NOW()",
      [email.trim().toLowerCase(), code]
    );

    if (tempUser.rows.length === 0) {
      return res.status(400).json({ error: "Código incorrecto o expirado." });
    }

    const { nombre, password_hash } = tempUser.rows[0];

    // 2. Movimiento a la tabla final de USUARIOS
    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol, status) VALUES ($1, $2, $3, 'paciente', 'activo') RETURNING *",
      [nombre, email.trim().toLowerCase(), password_hash]
    );

    // 3. Limpiamos la tabla temporal para no dejar basura
    // Asegúrate de que tu INSERT se vea así para que coincida con tu tabla:
await pool.query(
  'DELETE FROM registro_temporal WHERE email = $1',
  [email.trim().toLowerCase()]
);
    res.status(201).json(newUser.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
/**
 * ----------------------------------------------------------------------------
 * LÓGICA DE DESACTIVACIÓN AUTOMÁTICA (MODO PRECISIÓN HH:mm)
 * ----------------------------------------------------------------------------
 */
const verificarYDesactivarPracticantes = async () => {
  try {
    const ahora = new Date().toLocaleTimeString("en-GB", { 
      timeZone: "America/Mexico_City", 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    const HORA_DESACTIVACION = "00:38"; 

    if (ahora === HORA_DESACTIVACION) {
      const result = await pool.query(
        "UPDATE usuarios SET status = 'inactivo' WHERE rol = 'practicante' AND status = 'activo'"
      );
      
      if (result.rowCount > 0) {
        console.log(`🕒 [AUTO-CIERRE] Hora alcanzada (${ahora}). Se desactivaron ${result.rowCount} practicantes.`);
        await pool.query(
          "INSERT INTO logs_sistema (tipo, descripcion, metadata) VALUES ($1, $2, $3)",
          ['cierre_automatico', `Cierre de las 00:38 ejecutado`, JSON.stringify({ afectados: result.rowCount })]
        );
      }
    }
  } catch (error) {
    console.error("❌ Error en la desactivación automática:", error.message);
  }
};

setInterval(verificarYDesactivarPracticantes, 60000);

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: USUARIOS Y AUTENTICACIÓN
 * ----------------------------------------------------------------------------
 */

/**
 * ----------------------------------------------------------------------------
 * FORGOT PASSWORD — ENVIAR CÓDIGO
 * ----------------------------------------------------------------------------
 */
app.post('/api/auth/forgot-password', async (req, res) => {

  const { email } = req.body;

  try {

    // 1. Verificar si usuario existe
    const userResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'No existe una cuenta con ese correo.'
      });
    }

    // 2. Generar código
    const codigo = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    // 3. Guardar o actualizar código temporal
    await pool.query(
      `
      INSERT INTO password_resets (
        email,
        codigo_verificacion,
        expira_en
      )
      VALUES (
        $1,
        $2,
        NOW() + interval '15 minutes'
      )

      ON CONFLICT(email)
      DO UPDATE SET
        codigo_verificacion = $2,
        expira_en = NOW() + interval '15 minutes'
      `,
      [
        email.trim().toLowerCase(),
        codigo
      ]
    );

    // 4. Enviar correo
    const { error } = await resend.emails.send({

      from: 'Clinica UTC <noreply@clinicautc.com>',

      to: [email.trim().toLowerCase()],

      subject: 'Recuperación de contraseña - Clínica UTC',

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          overflow: hidden;
        ">

          <div style="
            background: linear-gradient(135deg, #1e3a8a, #2563eb);
            padding: 30px;
            text-align: center;
          ">
            <h1 style="
              color: white;
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            ">
              Clínica UTC
            </h1>
          </div>

          <div style="padding: 40px 30px;">

            <h2 style="
              color: #1e3a8a;
              margin-top: 0;
            ">
              Recuperación de contraseña
            </h2>

            <p style="
              color: #374151;
              font-size: 16px;
              line-height: 1.6;
            ">
              Recibimos una solicitud para restablecer tu contraseña.
            </p>

            <div style="
              background: #eff6ff;
              border: 2px solid #2563eb;
              border-radius: 16px;
              padding: 25px;
              text-align: center;
              margin: 30px 0;
            ">
              <p style="
                margin: 0 0 10px 0;
                color: #1e3a8a;
                font-weight: bold;
              ">
                Tu código de recuperación es:
              </p>

              <div style="
                font-size: 42px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #ea580c;
              ">
                ${codigo}
              </div>
            </div>

            <p style="
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
            ">
              Este código expirará en 15 minutos.
            </p>

          </div>
        </div>
      `
    });

    if (error) {
      return res.status(500).json({
        error: 'Error enviando correo.'
      });
    }

    res.status(200).json({
      message: 'Código enviado correctamente.'
    });

  } catch (error) {

    console.error(
      '❌ Error forgot-password:',
      error.message
    );

    res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
});

/**
 * ----------------------------------------------------------------------------
 * VERIFY RESET CODE
 * ----------------------------------------------------------------------------
 */
app.post('/api/auth/verify-reset-code', async (req, res) => {

  const { email, code } = req.body;

  try {

    const result = await pool.query(
      `
      SELECT * FROM password_resets
      WHERE email = $1
      AND codigo_verificacion = $2
      AND expira_en > NOW()
      `,
      [
        email.trim().toLowerCase(),
        code
      ]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'Código incorrecto o expirado.'
      });
    }

    res.status(200).json({
      message: 'Código válido.'
    });

  } catch (error) {

    console.error(
      '❌ Error verify-code:',
      error.message
    );

    res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
});


/**
 * ----------------------------------------------------------------------------
 * RESET PASSWORD
 * ----------------------------------------------------------------------------
 */
app.post('/api/auth/reset-password', async (req, res) => {

  const { email, newPassword } = req.body;
  const hashedPassword = await bcrypt.hash(
  newPassword,
  10
);

  try {

    // 1. Actualizar contraseña
    const result = await pool.query(
      `
      UPDATE usuarios
      SET password = $1
      WHERE email = $2
      RETURNING *
      `,
    [
      hashedPassword,
      email.trim().toLowerCase()
    ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }

    // 2. Limpiar códigos temporales
    await pool.query(
      `
      DELETE FROM password_resets
      WHERE email = $1
      `,
      [email.trim().toLowerCase()]
    );

    res.status(200).json({
      message: 'Contraseña actualizada correctamente.'
    });

  } catch (error) {

    console.error(
      '❌ Error reset-password:',
      error.message
    );

    res.status(500).json({
      error: 'Error interno del servidor.'
    });
  }
});

/**
 * ----------------------------------------------------------------------------
 * VALIDAR SESIÓN
 * ----------------------------------------------------------------------------
 */

app.get('/api/auth/validate-session', async (req, res) => {

  const email = req.headers.email;

  try {

    if (!email) {

      return res.status(400).json({
        valid: false,
        error: 'Email requerido'
      });
    }

    const result = await pool.query(
      `
      SELECT
        id,
        nombre,
        email,
        rol,
        area,
        status AS estado
      FROM usuarios
      WHERE email = $1
      `,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {

      return res.status(401).json({
        valid: false,
        error: 'Usuario no encontrado'
      });
    }

    const usuario = result.rows[0];

    // VALIDAR STATUS
    if (usuario.estado === 'inactivo') {

      return res.status(403).json({
        valid: false,
        error: 'Usuario inactivo'
      });
    }

    res.json({
      valid: true,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        area: usuario.area,
        estado: usuario.estado
      }
    });

  } catch (error) {

    console.error(
      'Error validate-session:',
      error.message
    );

    res.status(500).json({
      valid: false,
      error: 'Error interno'
    });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/usuarios/:id', async (req, res) => {

  const { id } = req.params;

  try {

    const result = await pool.query(
      'SELECT * FROM usuarios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json(result.rows[0]);

  } catch (error) {

    res.status(500).json({
      error: error.message
    });

  }

});



/**
 * ----------------------------------------------------------------------------
 * ENDPOINT DEFINITIVO: ACTUALIZAR PERFIL (NOMBRE, TELÉFONO Y MATRÍCULA)
 * ----------------------------------------------------------------------------
 */
app.patch('/api/usuarios/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, matricula } = req.body;

  // Validación de seguridad
  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ 
      error: 'No tienes autorización para modificar este perfil.' 
    });
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
});

app.put('/api/usuarios/:id',requireAuth,requireRole(['admin', 'master']),requireSameArea,async (req, res) => {
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

app.delete('/api/usuarios/:id',requireAuth,requireRole(['admin', 'master']),requireSameArea,async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: GESTIÓN DE PRACTICANTES (AUTORIZACIONES)
 * ----------------------------------------------------------------------------
 */

app.get('/api/practicantes',  requireAuth, requireRole([ 'admin', 'master' ]), async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM usuarios WHERE rol = 'practicante' ORDER BY fecha_creacion DESC");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/practicantes', async (req, res) => {
  const { nombre, email, matricula, area, estado, fecha_autorizacion } = req.body;

  const passwordTemporal = `UTC${matricula}`;

  const passwordHash = await bcrypt.hash(passwordTemporal, 10);

  try {
  const result = await pool.query(
  `INSERT INTO usuarios
  (nombre, email, password, rol, area, matricula, status, primer_inicio)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  RETURNING *`,
  [
    nombre.trim(),
    email.trim().toLowerCase(),
    passwordHash,
    'practicante',
    area,
    matricula,
    'activo',
    true
  ]
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

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: OPERACIONES CLÍNICAS (CITAS E HISTORIALES MÉDICOS)
 * ----------------------------------------------------------------------------
 */

app.get('/api/citas', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM citas ORDER BY fecha DESC, hora DESC');
    const citasEstandarizadas = result.rows.map(cita => ({
      ...cita,
      date: cita.fecha, 
      time: cita.hora,  
      status: cita.estado 
    }));
    res.json(citasEstandarizadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reemplaza este endpoint en tu index.js
/**
 * OBTENER CITAS POR PACIENTE
 * Se eliminó el filtro de CURRENT_DATE para que el paciente 
 * pueda visualizar sus registros previos y actuales.
 */
app.get('/api/citas/paciente/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM citas 
       WHERE paciente_id = $1 
       ORDER BY fecha DESC, hora DESC`, // Cambiado a DESC para ver las más recientes primero
      [id]
    );
    
    const citasSincronizadas = result.rows.map(cita => ({
      ...cita,
      tipo: cita.tipo,
      estado: cita.estado
    }));
    
    res.json(citasSincronizadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * OBTENER DISPONIBILIDAD DE HORARIOS (BLOQUEO POR ÁREA)
 * ----------------------------------------------------------------------------
 */
app.get('/api/citas/disponibilidad', async (req, res) => {
  const { fecha, tipo } = req.query; // tipo = 'nutricion' o 'fisioterapia'
  
  if (!fecha || !tipo) {
    return res.status(400).json({ error: "Faltan parámetros de fecha o tipo" });
  }

  try {
    // Buscamos las citas programadas para esa fecha y esa área específica
    const result = await pool.query(
      `SELECT hora FROM citas 
       WHERE fecha = $1 AND tipo = $2 AND estado IN ('programada', 'confirmada')`,
      [fecha, tipo.toLowerCase()]
    );
    
    // Extraemos solo un arreglo de strings con las horas ['08:00', '09:00']
    const horasOcupadas = result.rows.map(row => row.hora);
    
    res.json(horasOcupadas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/citas', requireAuth, requireRole(['paciente','admin','master']), async (req, res) => {
  const { paciente_id, paciente_nombre, tipo, fecha, hora, estado } = req.body;
  
  try {
    // 1. VALIDACIÓN ESTRICTA: ¿Ya existe una cita a esta hora y en esta área?
    const check = await pool.query(
      "SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'confirmada')",
      [fecha, hora, tipo.toLowerCase()]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ error: "Este horario ya fue ocupado en esta área. Por favor elige otro." });
    }

    // 2. Si está libre, insertamos
    const result = await pool.query(
      'INSERT INTO citas (paciente_id, paciente_nombre, tipo, fecha, hora, estado) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [paciente_id, paciente_nombre, tipo, fecha, hora, estado || 'programada']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * REAGENDAR O MODIFICAR CITA
 * Se agregó requireRole(['paciente', 'admin', 'master']) para permitir
 * que los coordinadores (admin) puedan re-agendar desde su panel.
 * ----------------------------------------------------------------------------
 */
app.put('/api/citas/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, tipo, estado } = req.body; // Asegúrate de mandar el 'tipo' desde el frontend al editar
  
  try {
    // 1. VALIDACIÓN ESTRICTA: Ignoramos la cita actual (id != $4) para que el paciente pueda conservar su misma hora si lo desea
    const check = await pool.query(
      "SELECT id FROM citas WHERE fecha = $1 AND hora = $2 AND tipo = $3 AND estado IN ('programada', 'confirmada') AND id != $4",
      [fecha, hora, tipo.toLowerCase(), id]
    );

    if (check.rows.length > 0) {
      return res.status(409).json({ error: "Este horario ya está ocupado. Elige otro." });
    }

    // 2. Actualizamos
    const result = await pool.query(
      `UPDATE citas SET fecha = $1, hora = $2, estado = $3 WHERE id = $4 RETURNING *`,
      [fecha, hora, estado || 'programada', id]
    );
    
    if (result.rows.length > 0) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
        ['cita_reagendada', result.rows[0].tipo, result.rows[0].paciente_id, JSON.stringify({ nueva_fecha: fecha, nueva_hora: hora })]
      );
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ error: "Cita no encontrada" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/citas/:id',requireAuth,canModifyAppointment,async (req, res) => {
  const { id } = req.params;
  try {
    const citaPrevia = await pool.query("SELECT * FROM citas WHERE id = $1", [id]);
    if (citaPrevia.rowCount > 0) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id) VALUES ($1, $2, $3)",
        ['cita_cancelada', citaPrevia.rows[0].tipo, citaPrevia.rows[0].paciente_id]
      );
    }
    const result = await pool.query('DELETE FROM citas WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount > 0) {
      res.json({ message: "Cita eliminada correctamente" });
    } else {
      res.status(404).json({ error: "No se encontró la cita" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/citas/:id/asignar',requireAuth,requireRole(['admin','master']),async (req, res) => {
  const { id } = req.params;
  const { practicante_id, practicante_nombre } = req.body;
  try {
    const result = await pool.query(
      `UPDATE citas SET practicante_id = $1, practicante_nombre = $2, estado = 'programada', fecha_asignacion = NOW() WHERE id = $3 RETURNING *`,
      [practicante_id, practicante_nombre, id]
    );
    res.json(result.rows.length > 0 ? result.rows[0] : res.status(404).json({ error: "No se encontró la cita." }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** * ----------------------------------------------------------------------------
 * SECCIÓN: GESTIÓN DE HISTORIALES (CONFIGURACIÓN API)
 * ----------------------------------------------------------------------------
 */

app.get('/api/historiales',requireAuth,requireRole(['practicante','admin','master']),async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM historiales_medicos ORDER BY fecha_creacion DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
});

/**
 * LÓGICA DE VERIFICACIÓN DE RECURRENCIA
 * Utilizada por los Dashboards de Practicante para cambiar el botón dinámicamente.
 */
app.get('/api/historiales/verificar/:pacienteId/:area', async (req, res) => {
  const { pacienteId, area } = req.params;
  const tabla = area === 'nutricion' ? 'historiales_nutricion' : 'historiales_fisioterapia';
  try {
    const result = await pool.query(`SELECT COUNT(*) FROM ${tabla} WHERE paciente_id = $1`, [pacienteId]);
    const esRecurrente = parseInt(result.rows[0].count) > 0;
    
    // Registro preventivo en métricas si se detecta paciente recurrente
    if (esRecurrente) {
      await pool.query(
        "INSERT INTO metricas (tipo_evento, area, paciente_id, metadata) VALUES ($1, $2, $3, $4)",
        ['paciente_recurrente', area, pacienteId, JSON.stringify({ mensaje: "Cita subsecuente detectada" })]
      );
    }
    res.json({ existe: esRecurrente });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/historiales/:id', requireAuth, async (req, res) => {
  const { id } = req.params; // ID del registro en la tabla de historiales
  const { datos } = req.body;
  
  // Determinamos la tabla por el tipo (puedes pasarlo desde el frontend)
  const { tipo } = req.body; 
  const tabla = tipo === 'nutricion' ? 'historiales_nutricion' : 'historiales_fisioterapia';

  try {
    const result = await pool.query(
      `UPDATE ${tabla} SET datos = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(datos), id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * OBTENER HISTORIALES POR PACIENTE Y ÁREA
 * Estos endpoints alimentan directamente al componente MedicalHistoryViewer_v2.
 */
/**
 * ENDPOINT: Obtener datos específicos de un historial por ID de Cita
 * Utilizado para el auto-rellenado de formularios guardados.
 */

/**
 * ENDPOINT: Obtener datos específicos de un historial de NUTRICIÓN
 */
app.get('/api/historiales-nutricion/detalle/:appointmentId', requireAuth, requireRole(['practicante', 'admin', 'master']), async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM historiales_nutricion WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1', // <-- SELECT *
      [appointmentId]
    );
    
    if (result.rows.length > 0) {
      let fila = result.rows[0];
      if (typeof fila.datos === 'string') {
        fila.datos = JSON.parse(fila.datos);
      }
      res.json(fila); // <-- Devolvemos toda la fila
    } else {
      res.status(404).json({ error: "No se encontraron datos para esta cita." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT: Obtener datos específicos de un historial de FISIOTERAPIA
 */
app.get('/api/historiales-fisioterapia/detalle/:appointmentId', requireAuth, requireRole(['practicante', 'admin', 'master']), async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM historiales_fisioterapia WHERE appointment_id = $1 ORDER BY id DESC LIMIT 1', // <-- SELECT *
      [appointmentId]
    );
    
    if (result.rows.length > 0) {
      let fila = result.rows[0];
      if (typeof fila.datos === 'string') {
        fila.datos = JSON.parse(fila.datos);
      }
      res.json(fila); // <-- Devolvemos toda la fila
    } else {
      res.status(404).json({ error: "No se encontraron datos para esta cita." });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT: Obtener todos los historiales de NUTRICIÓN de un paciente
 */
app.get('/api/historiales-nutricion/paciente/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM historiales_nutricion WHERE paciente_id = $1 ORDER BY fecha_creacion DESC', 
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * ENDPOINT: Obtener todos los historiales de FISIOTERAPIA de un paciente
 */
app.get('/api/historiales-fisioterapia/paciente/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM historiales_fisioterapia WHERE paciente_id = $1 ORDER BY fecha_creacion DESC', 
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GUARDADO DE HISTORIAL CLÍNICO (MASTER POST)
 * Realiza tres acciones clave: Guarda datos, actualiza cita y registra métrica.
 */
app.post('/api/historiales', async (req, res) => {
  let { paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre, appointment_id, duracion_carga, timestamp_inicio } = req.body;
  
  const tipoLimpio = tipo ? tipo.trim().toLowerCase() : 'medicos';
  let tablaDestino = 'historiales_medicos';
  
  if (tipoLimpio === 'nutricion') tablaDestino = 'historiales_nutricion';
  else if (tipoLimpio === 'fisioterapia') tablaDestino = 'historiales_fisioterapia';

  try {
    // --- NUEVA LÓGICA DE AUTO-COMPLETADO ---
    // Si el formulario nos envía el ID de la cita, le preguntamos a la base de datos a quién le pertenece.
    if (appointment_id) {
      const citaResult = await pool.query('SELECT paciente_id, paciente_nombre FROM citas WHERE id = $1', [appointment_id]);
      
      if (citaResult.rows.length > 0) {
        // Rellenamos automáticamente el paciente_id si venía nulo o vacío desde el frontend
        paciente_id = paciente_id || citaResult.rows[0].paciente_id;
        
        // Si el nombre venía como "Paciente sin nombre", usamos el nombre real de la cita
        if (!paciente_nombre || paciente_nombre === "Paciente sin nombre") {
          paciente_nombre = citaResult.rows[0].paciente_nombre;
        }
      }
    }

    // 1. Inserción del registro clínico en la tabla correspondiente (ahora con el paciente_id garantizado)
    const result = await pool.query(
      `INSERT INTO ${tablaDestino} (paciente_id, paciente_nombre, tipo, datos, creado_por, creado_por_nombre, appointment_id, duracion_carga, timestamp_inicio) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [paciente_id, paciente_nombre, tipoLimpio, JSON.stringify(datos), creado_por, creado_por_nombre, appointment_id, duracion_carga || 0, timestamp_inicio || null]
    );

    // 2. ACTUALIZAR ESTADO DE LA CITA PARA QUE DESAPAREZCA DEL DASHBOARD
    if (appointment_id) {
      await pool.query("UPDATE citas SET estado = 'completada' WHERE id = $1", [appointment_id]);
    }

    // 3. Registro de métrica para el dashboard de control del Master/Admin
    await pool.query(
      "INSERT INTO metricas (tipo_evento, area, valor_numerico, paciente_id) VALUES ($1, $2, $3, $4)",
      ['tiempo_consulta', tipoLimpio, duracion_carga || 0, paciente_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * OBTENER HOJA EVOLUTIVA POR ID DE CITA
 * Recupera el JSON guardado para rellenar la vista del frontend.
 */
app.get('/api/notas-evolucion/:id', requireAuth, async (req, res) => {
  const { id } = req.params; // El frontend envía el ID de la cita en la URL
  try {
    const result = await pool.query(
      'SELECT * FROM notas_evolucion WHERE appointment_id = $1 ORDER BY fecha_elaboracion DESC LIMIT 1',
      [id]
    );
    
    if (result.rows.length > 0) {
      let fila = result.rows[0];
      // Si PostgreSQL lo devuelve como texto, lo parseamos a JSON
      if (typeof fila.cuadro_evolucion === 'string') {
        fila.cuadro_evolucion = JSON.parse(fila.cuadro_evolucion);
      }
      res.json(fila);
    } else {
      // Devolvemos un objeto vacío para que el frontend no falle si es la primera vez
      res.status(200).json({ cuadro_evolucion: {} }); 
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GUARDAR HOJA EVOLUTIVA
 * Ahora protegido con requireAuth
 */
app.post('/api/notas-evolucion', requireAuth, async (req, res) => {
  let { paciente_id, practicante_id, appointment_id, nombre_completo, numero_expediente, edad, fecha_elaboracion, cuadro_evolucion, area } = req.body;
  
  try {
    // 1. CONVERSIÓN ESTRICTA A ENTEROS (integer)
    // Para evitar que PostgreSQL rechace textos ('15' -> 15)
    const apptIdInt = parseInt(appointment_id, 10) || null;
    const practIdInt = parseInt(practicante_id, 10) || null;
    let pacIdInt = parseInt(paciente_id, 10) || null;

    // 2. AUTO-COMPLETADO DEL PACIENTE
    if (apptIdInt) {
      const citaResult = await pool.query('SELECT paciente_id, paciente_nombre FROM citas WHERE id = $1', [apptIdInt]);
      
      if (citaResult.rows.length > 0) {
        pacIdInt = parseInt(citaResult.rows[0].paciente_id, 10);
        
        if (!nombre_completo || nombre_completo === 'Sin nombre') {
          nombre_completo = citaResult.rows[0].paciente_nombre;
        }
      }
    }

    // 3. INSERCIÓN BLINDADA (Agregamos fecha_creacion con NOW())
    const result = await pool.query(
      `INSERT INTO notas_evolucion (
        paciente_id, 
        practicante_id, 
        appointment_id, 
        nombre_completo, 
        numero_expediente, 
        edad, 
        fecha_elaboracion, 
        cuadro_evolucion, 
        area, 
        fecha_creacion
      ) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()) RETURNING *`,
      [
        pacIdInt,                  // $1 (integer)
        practIdInt,                // $2 (integer)
        apptIdInt,                 // $3 (integer)
        nombre_completo,           // $4 (character varying)
        numero_expediente,         // $5 (character varying)
        parseInt(edad, 10) || 0,   // $6 (integer)
        fecha_elaboracion,         // $7 (timestamp)
        JSON.stringify(cuadro_evolucion || {}), // $8 (text - json)
        area || 'nutricion'        // $9 (character varying)
        // El $10 lo maneja directamente NOW() en la consulta
      ]
    );
    
    res.status(201).json(result.rows[0]);

  } catch (error) {
    // Si la consola arroja código 23503, es porque la cita (appointment_id) no existe en tu tabla 'citas'
    console.error("❌ Error BD notas-evolucion:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: SISTEMA DE LOGS Y COMUNICADOS
 * ----------------------------------------------------------------------------
 */

app.get('/api/logs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM logs_sistema ORDER BY fecha DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/notas_universitarias', requireAuth, async (req, res) => {
  try {
   const result = await pool.query(`
      SELECT 
        n.*, 
        u.rol AS creado_por_rol 
      FROM notas_universitarias n
      LEFT JOIN usuarios u ON n.creado_por = u.id
      ORDER BY n.fecha_creacion DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/notas_universitarias', requireAuth, async (req, res) => {
  const { titulo, contenido, creado_por, creado_por_nombre, destino, destinatario_especifico, creado_por_email } = req.body;

  try {
    const result = await pool.query(
  `INSERT INTO notas_universitarias (titulo, contenido, categoria, creado_por, creado_por_nombre, fecha_creacion, destinatario_especifico, creado_por_email) 
   VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7) RETURNING *`,
  [titulo, contenido, destino, creado_por, creado_por_nombre, destinatario_especifico, creado_por_email]
);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/notas_universitarias/:id/responder', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { respuesta } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE notas_universitarias 
       SET respuesta = $1, fecha_respuesta = NOW() 
       WHERE id = $2 
       RETURNING *`, 
      [respuesta, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "La nota no existe." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error en PUT responder:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * ----------------------------------------------------------------------------
 * SECCIÓN: ESTADÍSTICAS E INTELIGENCIA
 * ----------------------------------------------------------------------------
 */

app.get('/api/stats/dashboard',requireAuth,requireRole(['admin','master']),async (req, res) => {
  try {
    const total = await pool.query("SELECT COUNT(*) FROM citas");
    const completadas = await pool.query("SELECT COUNT(*) FROM citas WHERE estado = 'completada'");
    const programadas = await pool.query("SELECT COUNT(*) FROM citas WHERE estado = 'programada'");
    const canceladasMetrica = await pool.query("SELECT COUNT(*) FROM metricas WHERE tipo_evento = 'cita_cancelada'");
    const reagendadasMetrica = await pool.query("SELECT COUNT(*) FROM metricas WHERE tipo_evento = 'cita_reagendada'");
    const promedioConsultaMetrica = await pool.query("SELECT AVG(valor_numerico) FROM metricas WHERE tipo_evento = 'tiempo_consulta'");
    
    res.json({
      totalCitas: parseInt(total.rows[0].count),
      citasCompletadas: parseInt(completadas.rows[0].count),
      citasCanceladas: parseInt(canceladasMetrica.rows[0].count),
      citasProgramadas: parseInt(programadas.rows[0].count),
      reagendadas: parseInt(reagendadasMetrica.rows[0].count),
      promedioConsulta: Math.round(promedioConsultaMetrica.rows[0].avg || 0),
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send(' Servidor UTC Activo - API funcionando correctamente.');
});

app.listen(PORT, () => {
  console.log(` API DE LA CLÍNICA UTC EJECUTÁNDOSE - PUERTO ${PORT}`);
});




/**
 * Api de las recomendaciones
 * 
 */

// --- Endpoint para GUARDAR (POST) ---
app.post('/api/recomendaciones', requireAuth, async (req, res) => {
  const { paciente_id, paciente_nombre, contenido, creado_por_id, creado_por_nombre, area } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO recomendaciones_nutricion 
      (paciente_id, paciente_nombre, contenido, creado_por_id, creado_por_nombre, area) 
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [paciente_id, paciente_nombre, contenido, creado_por_id, creado_por_nombre, area]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al guardar en recomendaciones_nutricion:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// --- Endpoint para OBTENER (GET) ---
app.get('/api/recomendaciones/paciente/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { area } = req.query;
  
  try {
    const result = await pool.query(
      'SELECT * FROM recomendaciones_nutricion WHERE paciente_id = $1 AND area = $2 ORDER BY fecha_creacion DESC',
      [id, area]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener de recomendaciones_nutricion:", error.message);
    res.status(500).json({ error: error.message });
  }
});