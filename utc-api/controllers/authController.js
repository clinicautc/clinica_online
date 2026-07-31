const bcrypt = require('bcrypt');
const pool = require('../db');
const notificationService = require('../services/notificationService');
const { signAccessToken, generateRefreshToken, hashToken } = require('../middleware/authMiddleware');

// Emite y persiste un par de tokens para un usuario ya autenticado.
async function issueTokens(usuario) {
  const accessToken = signAccessToken(usuario);
  const { token: refreshToken, tokenHash, expiraEn } = generateRefreshToken();

  await pool.query(
    'INSERT INTO refresh_tokens (usuario_id, token_hash, expira_en) VALUES ($1, $2, $3)',
    [usuario.id, tokenHash, expiraEn]
  );

  return { accessToken, refreshToken };
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];

    // PASSWORD VIEJA (texto plano) — migración automática a bcrypt
    if (usuario.password === password) {
      // Aplicar los mismos checks que el path bcrypt antes de emitir tokens
      if (usuario.status === 'inactivo') {
        return res.status(403).json({ error: 'Tu cuenta se encuentra inactiva.' });
      }
      if (usuario.primer_inicio) {
        return res.json({
          success: true,
          requiereCambioPassword: true,
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre
        });
      }

      const nuevaHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE usuarios SET password = $1 WHERE id = $2', [nuevaHash, usuario.id]);
      console.log(` Password migrada automáticamente: ${usuario.email}`);

      const { password: _omit1, ...usuarioSafe1 } = usuario;
      const tokens1 = await issueTokens(usuario);
      return res.json({ ...usuarioSafe1, ...tokens1 });
    }

    // PASSWORD NUEVA (bcrypt)
    const passwordCorrecta = await bcrypt.compare(password, usuario.password);

    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (usuario.status === 'inactivo') {
      return res.status(403).json({ error: 'Tu cuenta se encuentra inactiva.' });
    }

    // PRIMER INICIO: credenciales correctas, pero todavía no se emite sesión real.
    // El frontend debe redirigir obligatoriamente al cambio de contraseña.
    if (usuario.primer_inicio) {
      return res.json({
        success: true,
        requiereCambioPassword: true,
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre
      });
    }

    const { password: _omit2, ...usuarioSafe2 } = usuario;
    const tokens2 = await issueTokens(usuario);
    res.json({ ...usuarioSafe2, ...tokens2 });

  } catch (error) {
    console.error('Error login:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function validateSession(req, res) {
  // Endpoint legacy que aceptaba header `email` sin verificación JWT.
  // Ahora requiere Bearer token — delegamos a /auth/refresh o /auth/login.
  return res.status(410).json({ valid: false, error: 'Endpoint obsoleto. Usa el flujo JWT.' });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'refreshToken requerido' });
  }

  try {
    const tokenHash = hashToken(refreshToken);

    const tokenResult = await pool.query(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = $1 AND revocado = false AND expira_en > NOW()`,
      [tokenHash]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Sesión expirada, inicia sesión de nuevo.' });
    }

    const tokenRow = tokenResult.rows[0];

    const userResult = await pool.query(
      'SELECT id, nombre, email, rol, area, status, telefono, matricula, numero_empleado FROM usuarios WHERE id = $1',
      [tokenRow.usuario_id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado.' });
    }

    const usuario = userResult.rows[0];

    if (usuario.status === 'inactivo') {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Rotación: se revoca el token usado y se emite uno nuevo.
    await pool.query('UPDATE refresh_tokens SET revocado = true WHERE id = $1', [tokenRow.id]);

    const accessToken = signAccessToken(usuario);
    const { token: newRefreshToken, tokenHash: newHash, expiraEn } = generateRefreshToken();

    await pool.query(
      'INSERT INTO refresh_tokens (usuario_id, token_hash, expira_en) VALUES ($1, $2, $3)',
      [usuario.id, newHash, expiraEn]
    );

    res.json({ accessToken, refreshToken: newRefreshToken, user: usuario });

  } catch (error) {
    console.error('Error en /refresh:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function logout(req, res) {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await pool.query('UPDATE refresh_tokens SET revocado = true WHERE token_hash = $1', [tokenHash]);
    }

    res.json({ message: 'Sesión cerrada.' });

  } catch (error) {
    console.error('Error en /logout:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function preRegister(req, res) {
  console.log('🚨 PRE-REGISTER EJECUTADO');
  const { name, email, password, telefono } = req.body;

  // TELÉFONO: opcional — no debe impedir el registro. Si viene, solo dígitos
  // (máx. 10), igual que la validación de "editar perfil" (usuariosController).
  if (telefono && !/^\d{1,10}$/.test(telefono)) {
    return res.status(400).json({ error: 'El teléfono solo puede contener números (máximo 10 dígitos).' });
  }

  // VALIDACIÓN DE NOMBRE: solo letras y espacios (respaldo del lado del
  // servidor a la validación que ya existe en el formulario de registro).
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,90}$/.test((name || '').trim())) {
    return res.status(400).json({ error: 'El nombre solo puede contener letras y espacios.' });
  }

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const existingUser = await pool.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Este correo ya está registrado.' });
    }

    // Inserción en la tabla de retención (Ya verificada)
    await pool.query(
      `INSERT INTO registro_temporal (nombre, email, password_hash, codigo_verificacion, expira_en, telefono)
       VALUES ($1, $2, $3, $4, NOW() + interval '15 minutes', $5)
       ON CONFLICT (email) DO UPDATE SET
       nombre = $1, password_hash = $3, codigo_verificacion = $4, expira_en = NOW() + interval '15 minutes', telefono = $5`,
      [name, email.trim().toLowerCase(), hashedPassword, codigo, telefono || null]
    );

    await notificationService.notificarCodigoVerificacion(name, email.trim().toLowerCase(), codigo);

    res.status(200).json({ message: "Código enviado con éxito." });
  } catch (error) {
    console.error("❌ Error interno en Pre-Registro:", error.message);
    res.status(500).json({ error: "Error en el servidor al procesar el registro." });
  }
}

async function verifyAndRegister(req, res) {
  const { email, code } = req.body;

  try {
    const tempUser = await pool.query(
      "SELECT * FROM registro_temporal WHERE email = $1 AND codigo_verificacion = $2 AND expira_en > NOW()",
      [email.trim().toLowerCase(), code]
    );

    if (tempUser.rows.length === 0) {
      return res.status(400).json({ error: "Código incorrecto o expirado." });
    }

    const { nombre, password_hash, telefono } = tempUser.rows[0];

    const newUser = await pool.query(
      "INSERT INTO usuarios (nombre, email, password, rol, status, telefono) VALUES ($1, $2, $3, 'paciente', 'activo', $4) RETURNING *",
      [nombre, email.trim().toLowerCase(), password_hash, telefono || null]
    );

    // Limpiamos la tabla temporal para no dejar basura
    await pool.query('DELETE FROM registro_temporal WHERE email = $1', [email.trim().toLowerCase()]);

    notificationService.notificarBienvenidaPaciente(nombre, email.trim().toLowerCase());

    const { password: _omitPassword, ...usuarioCreado } = newUser.rows[0];
    const tokens = await issueTokens(newUser.rows[0]);
    res.status(201).json({ ...usuarioCreado, ...tokens });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function forgotPassword(req, res) {
  const { email } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO password_resets (email, codigo_verificacion, expira_en)
       VALUES ($1, $2, NOW() + interval '15 minutes')
       ON CONFLICT(email)
       DO UPDATE SET codigo_verificacion = $2, expira_en = NOW() + interval '15 minutes'`,
      [email.trim().toLowerCase(), codigo]
    );

    await notificationService.notificarRecuperacionPassword(userResult.rows[0].nombre, email.trim().toLowerCase(), codigo);

    res.status(200).json({ message: 'Código enviado correctamente.' });

  } catch (error) {
    console.error('❌ Error forgot-password:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

async function resendCode(req, res) {
  const { email, tipo } = req.body;

  try {
    let temporal;

    if (tipo === 'registro') {
      temporal = await pool.query('SELECT * FROM registro_temporal WHERE email = $1', [email.trim().toLowerCase()]);
    } else if (tipo === 'password' || tipo === 'primer_inicio') {
      temporal = await pool.query('SELECT * FROM password_resets WHERE email = $1', [email.trim().toLowerCase()]);
    } else {
      return res.status(400).json({ error: 'Tipo de reenvío inválido. Usa "registro", "password" o "primer_inicio".' });
    }

    if (temporal.rows.length === 0) {
      return res.status(404).json({
        error: tipo === 'registro'
          ? 'No existe una solicitud de registro pendiente.'
          : 'No existe una solicitud de recuperación pendiente.'
      });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    if (tipo === 'registro') {
      await pool.query(
        `UPDATE registro_temporal SET codigo_verificacion = $1, expira_en = NOW() + interval '15 minutes' WHERE email = $2`,
        [codigo, email.trim().toLowerCase()]
      );
    } else if (tipo === 'password') {
      await pool.query(
        `UPDATE password_resets SET codigo_verificacion = $1, expira_en = NOW() + interval '15 minutes' WHERE email = $2`,
        [codigo, email.trim().toLowerCase()]
      );
    }

    let nombre = 'Usuario';

    if (tipo === 'registro') {
      nombre = temporal.rows[0].nombre;
    } else if (tipo === 'password') {
      const usuario = await pool.query('SELECT nombre FROM usuarios WHERE email = $1', [email.trim().toLowerCase()]);
      if (usuario.rows.length > 0) {
        nombre = usuario.rows[0].nombre;
      }
    }

    if (tipo === 'registro') {
      await notificationService.notificarReenvioCodigoVerificacion(nombre, email.trim().toLowerCase(), codigo);
    } else if (tipo === 'primer_inicio') {
      await notificationService.notificarReenvioCodigoPrimerInicio(nombre, email.trim().toLowerCase(), codigo);
    } else {
      await notificationService.notificarReenvioRecuperacionPassword(nombre, email.trim().toLowerCase(), codigo);
    }

    res.status(200).json({ message: 'Código reenviado correctamente.' });

  } catch (error) {
    console.error('❌ Error resend-code:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

async function verifyResetCode(req, res) {
  const { email, code } = req.body;

  try {
    const result = await pool.query(
      `SELECT * FROM password_resets WHERE email = $1 AND codigo_verificacion = $2 AND expira_en > NOW()`,
      [email.trim().toLowerCase(), code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Código incorrecto o expirado.' });
    }

    res.status(200).json({ message: 'Código válido.' });

  } catch (error) {
    console.error('❌ Error verify-code:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

async function resetPassword(req, res) {
  const { email, code, newPassword } = req.body;

  try {
    if (!newPassword) {
      return res.status(400).json({ error: 'La nueva contraseña es requerida.' });
    }
    if (!code) {
      return res.status(400).json({ error: 'El código de verificación es requerido.' });
    }

    const emailNormalizado = email.trim().toLowerCase();

    const codigoValido = await pool.query(
      `SELECT * FROM password_resets WHERE email = $1 AND codigo_verificacion = $2 AND expira_en > NOW()`,
      [emailNormalizado, code]
    );

    if (codigoValido.rows.length === 0) {
      return res.status(400).json({ error: 'Código incorrecto o expirado.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      `UPDATE usuarios SET password = $1 WHERE email = $2 RETURNING *`,
      [hashedPassword, emailNormalizado]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    await pool.query('DELETE FROM password_resets WHERE email = $1', [emailNormalizado]);

    res.status(200).json({ message: 'Contraseña actualizada correctamente.' });

  } catch (error) {
    console.error('❌ Error reset-password:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

// CAMBIO DE CONTRASEÑA OBLIGATORIO (PRIMER INICIO)
// Verifica la contraseña temporal (UTC+matrícula), guarda la nueva con bcrypt,
// apaga primer_inicio y recién ahí emite la sesión real (igual que login()).
async function sendCodigoPrimerInicio(req, res) {
  const { email } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT nombre, primer_inicio FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'No existe una cuenta con ese correo.' });
    }

    const { nombre, primer_inicio } = userResult.rows[0];

    if (!primer_inicio) {
      return res.status(400).json({ error: 'Esta cuenta ya completó su configuración inicial.' });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO password_resets (email, codigo_verificacion, expira_en)
       VALUES ($1, $2, NOW() + interval '15 minutes')
       ON CONFLICT(email)
       DO UPDATE SET codigo_verificacion = $2, expira_en = NOW() + interval '15 minutes'`,
      [email.trim().toLowerCase(), codigo]
    );

    await notificationService.notificarCodigoPrimerInicio(nombre, email.trim().toLowerCase(), codigo);

    res.status(200).json({ message: 'Código de configuración enviado.' });

  } catch (error) {
    console.error('❌ Error send-codigo-primer-inicio:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

async function cambiarPasswordInicial(req, res) {
  const { email, passwordActual, passwordNueva } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];

    if (!usuario.primer_inicio) {
      return res.status(400).json({ error: 'Esta cuenta ya completó su primer inicio de sesión.' });
    }

    const passwordCorrecta = await bcrypt.compare(passwordActual, usuario.password);

    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const nuevaHash = await bcrypt.hash(passwordNueva, 10);

    const updateResult = await pool.query(
      'UPDATE usuarios SET password = $1, primer_inicio = false WHERE id = $2 RETURNING *',
      [nuevaHash, usuario.id]
    );

    const usuarioActualizado = updateResult.rows[0];
    const { password: _omitPassword, ...usuarioSafe } = usuarioActualizado;
    const tokens = await issueTokens(usuarioActualizado);

    res.json({ ...usuarioSafe, ...tokens });

  } catch (error) {
    console.error('❌ Error cambiar-password-inicial:', error.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}

module.exports = {
  login,
  validateSession,
  refresh,
  logout,
  preRegister,
  verifyAndRegister,
  forgotPassword,
  sendCodigoPrimerInicio,
  resendCode,
  verifyResetCode,
  resetPassword,
  cambiarPasswordInicial
};
