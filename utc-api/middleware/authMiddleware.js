// authMiddleware.js

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

/**
 * ============================================================================
 * REQUIRE AUTH
 * ============================================================================
 */

const requireAuth = async (
  req,
  res,
  next
) => {

  try {

    const email = req.headers.email;

    if (!email) {

      return res.status(401).json({
        error: 'Sesión requerida'
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
        status
      FROM usuarios
      WHERE email = $1
      `,
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {

      return res.status(401).json({
        error: 'Usuario no válido'
      });
    }

    const usuario = result.rows[0];

    if (usuario.status === 'inactivo') {

      return res.status(403).json({
        error: 'Usuario inactivo'
      });
    }

    req.user = usuario;

    next();

  } catch (error) {

    console.error(
      'Middleware auth error:',
      error.message
    );

    res.status(500).json({
      error: 'Error validando sesión'
    });
  }
};

/**
 * ============================================================================
 * REQUIRE ROLE
 * ============================================================================
 */

const requireRole = (
  roles = []
) => {

  return (
    req,
    res,
    next
  ) => {

    if (!req.user) {

      return res.status(401).json({
        error: 'No autenticado'
      });
    }

    if (
      !roles.includes(req.user.rol)
    ) {

      return res.status(403).json({
        error: 'No autorizado'
      });
    }

    next();
  };
};

/**
 * ============================================================================
 * REQUIRE SAME AREA
 * ============================================================================
 */

const requireSameArea = async (
  req,
  res,
  next
) => {

  try {

    /**
     * ==========================================================
     * MASTER PUEDE TODO
     * ==========================================================
     */

    if (req.user.rol === 'master') {
      return next();
    }

    /**
     * ==========================================================
     * SOLO ADMINS
     * ==========================================================
     */

    if (req.user.rol !== 'admin') {

      return res.status(403).json({
        error: 'No autorizado'
      });
    }

    const userId = req.params.id;

    const result = await pool.query(
      `
      SELECT area
      FROM usuarios
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    const usuarioObjetivo =
      result.rows[0];

    /**
     * ==========================================================
     * VALIDAR ÁREA
     * ==========================================================
     */

    if (
      usuarioObjetivo.area !== req.user.area
    ) {

      return res.status(403).json({
        error:
          'No puedes modificar otra área'
      });
    }

    next();

  } catch (error) {

    console.error(
      'requireSameArea:',
      error.message
    );

    res.status(500).json({
      error: 'Error interno'
    });
  }
};

/**
 * ============================================================================
 * CAN MODIFY APPOINTMENT
 * ============================================================================
 */

const canModifyAppointment = async (
  req,
  res,
  next
) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM citas
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: 'Cita no encontrada'
      });
    }

    const cita = result.rows[0];
    const user = req.user;

    /**
     * ======================================================
     * MASTER
     * ======================================================
     */

    if (user.rol === 'master') {
      return next();
    }

    /**
     * ======================================================
     * ADMIN
     * ======================================================
     */

    if (user.rol === 'admin') {

      const mismaArea =
        cita.tipo?.toLowerCase()
          .includes(user.area);

      if (!mismaArea) {

        return res.status(403).json({
          error:
            'No puedes modificar citas de otra área'
        });
      }

      return next();
    }

    

  /**
 * ======================================================
 * PACIENTE
 * ======================================================
 */

if (user.rol === 'paciente') {

  const esSuCita =
    String(cita.paciente_id) ===
    String(user.id);

  if (!esSuCita) {

    return res.status(403).json({
      error:
        'No puedes modificar citas ajenas'
    });
  }

  return next();
}

    /**
     * ======================================================
     * PRACTICANTE
     * ======================================================
     */

    return res.status(403).json({
      error: 'No autorizado'
    });

  } catch (error) {

    console.error(
      'Appointment middleware error:',
      error.message
    );

    res.status(500).json({
      error: 'Error validando cita'
    });
  }
};

module.exports = {
  requireAuth,
  requireRole,
  requireSameArea,
  canModifyAppointment
};