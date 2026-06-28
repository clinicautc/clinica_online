// authMiddleware.js

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ACCESS_TTL = process.env.JWT_ACCESS_TTL || '15m';
const REFRESH_TOKEN_TTL_DAYS = 14;

/**
 * ============================================================================
 * EMISIÓN DE TOKENS (usado por authRoutes.js en login/refresh)
 * ============================================================================
 */

function signAccessToken(usuario) {
  return jwt.sign(
    {
      sub: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      area: usuario.area
    },
    JWT_SECRET,
    { expiresIn: JWT_ACCESS_TTL }
  );
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Genera un refresh token opaco (no JWT) y su fecha de expiración.
function generateRefreshToken() {
  const token = crypto.randomBytes(48).toString('hex');
  const expiraEn = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  return { token, tokenHash: hashToken(token), expiraEn };
}

/**
 * ============================================================================
 * VERIFY TOKEN / REQUIRE AUTH
 * Acepta un access token JWT (Authorization: Bearer) y, de forma temporal,
 * el header legado `email` mientras el frontend termina de migrar (Fase C).
 * Una vez que ningún fetch() dependa del header `email`, eliminar ese fallback.
 * ============================================================================
 */

const verifyToken = async (
  req,
  res,
  next
) => {

  try {

    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {

      const token = authHeader.slice(7);

      try {

        const payload = jwt.verify(token, JWT_SECRET);

        req.user = {
          id: payload.sub,
          nombre: payload.nombre,
          email: payload.email,
          rol: payload.rol,
          area: payload.area,
          status: 'activo'
        };

        return next();

      } catch (jwtError) {

        return res.status(401).json({
          error: 'Token inválido o expirado'
        });
      }
    }

    // --- FALLBACK TEMPORAL: header `email` heredado (se retira en Fase C) ---
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

// Mismo nombre que usan todas las rutas de index.js: cero cambios de firma.
const requireAuth = verifyToken;

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

      if (!user.area) {
        return res.status(403).json({ error: 'Tu cuenta de admin no tiene área asignada.' });
      }

      const mismaArea =
        cita.tipo?.toLowerCase()
          .includes(user.area.toLowerCase());

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
  verifyToken,
  requireRole,
  requireSameArea,
  canModifyAppointment,
  signAccessToken,
  generateRefreshToken,
  hashToken,
  REFRESH_TOKEN_TTL_DAYS
};