const bcrypt = require('bcrypt');
const pool = require('../db');
const notificationService = require('../services/notificationService');

const USUARIO_COLUMNAS_SEGURAS = 'id, nombre, email, rol, area, status, telefono, matricula, numero_empleado, primer_inicio, fecha_creacion';

async function getAll(req, res) {
  try {
    const result = await pool.query(`SELECT ${USUARIO_COLUMNAS_SEGURAS} FROM usuarios ORDER BY fecha_creacion DESC`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(`SELECT ${USUARIO_COLUMNAS_SEGURAS} FROM usuarios WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// ENDPOINT DEFINITIVO: ACTUALIZAR PERFIL (NOMBRE, TELÉFONO Y MATRÍCULA)
async function updateProfile(req, res) {
  const { id } = req.params;
  const { telefono, matricula } = req.body;

  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No tienes autorización para modificar este perfil.' });
  }

  // El nombre nunca se acepta en este endpoint (no se puede modificar el propio
  // nombre, bloqueado en el frontend para todos los roles). La matrícula solo
  // la puede tocar un paciente, y solo dígitos (máx. 9) — respaldo del lado del
  // servidor al bloqueo de ese campo en el frontend para practicante/admin/master.
  const esPaciente = req.user.rol === 'paciente';
  let matriculaFinal = null; // null -> COALESCE conserva el valor actual (campo bloqueado)

  if (esPaciente && matricula !== undefined) {
    if (matricula && !/^\d{1,9}$/.test(matricula)) {
      return res.status(400).json({ error: 'La matrícula solo puede contener números (máximo 9 dígitos).' });
    }
    matriculaFinal = matricula || '';
  }

  // TELÉFONO: solo dígitos, máximo 10 — respaldo del lado del servidor a la
  // validación que ya existe en el frontend.
  if (telefono && !/^\d{1,10}$/.test(telefono)) {
    return res.status(400).json({ error: 'El teléfono solo puede contener números (máximo 10 dígitos).' });
  }

  try {
    const result = await pool.query(
      `UPDATE usuarios
       SET telefono = COALESCE($1, telefono),
           matricula = COALESCE($2, matricula)
       WHERE id = $3
       RETURNING id, nombre, telefono, matricula, email, rol, area, status`,
      [telefono, matriculaFinal, id]
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
}

// PASO 1 DE 2 — SOLICITAR CAMBIO DE CORREO (SOLO PACIENTE)
// Genera un código de 6 dígitos y lo envía al correo NUEVO (no al actual) para
// confirmar que el paciente controla esa bandeja antes de tocar usuarios.email.
async function solicitarCambioEmail(req, res) {
  const { id } = req.params;
  const { nuevoEmail } = req.body;

  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No tienes autorización para modificar este perfil.' });
  }
  if (req.user.rol !== 'paciente') {
    return res.status(403).json({ error: 'Solo los pacientes pueden cambiar su correo desde aquí.' });
  }

  const emailNormalizado = (nuevoEmail || '').trim().toLowerCase();
  if (!emailNormalizado || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
    return res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
  }
  if (emailNormalizado === (req.user.email || '').toLowerCase()) {
    return res.status(400).json({ error: 'Ese ya es tu correo actual.' });
  }

  try {
    const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND id != $2', [emailNormalizado, id]);
    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Ese correo ya está en uso por otra cuenta.' });
    }

    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    // Si ya había una solicitud previa programada (confirmado=true, en
    // período de gracia), una solicitud nueva la reemplaza por completo y
    // cancela esa programación — vuelve a empezar desde el código.
    await pool.query(
      `INSERT INTO email_change_requests (usuario_id, nuevo_email, codigo_verificacion, expira_en, confirmado, aplicar_en)
       VALUES ($1, $2, $3, NOW() + interval '15 minutes', false, NULL)
       ON CONFLICT (usuario_id) DO UPDATE SET
         nuevo_email = $2, codigo_verificacion = $3, expira_en = NOW() + interval '15 minutes',
         confirmado = false, aplicar_en = NULL`,
      [id, emailNormalizado, codigo]
    );

    await notificationService.notificarCodigoCambioEmail(req.user.nombre, emailNormalizado, codigo);

    return res.json({ message: 'Código enviado a tu nuevo correo.' });
  } catch (error) {
    console.error('❌ Error solicitando cambio de correo:', error.message);
    return res.status(500).json({ error: 'Error al procesar la solicitud de cambio de correo.' });
  }
}

// PASO 1C — VALIDAR CÓDIGO (solo verifica, no aplica el cambio todavía).
// Se usa para no dejar avanzar al diálogo de confirmación si el código está
// mal o expiró — el cambio real sigue requiriendo confirmarCambioEmail con
// contraseña.
async function validarCodigoCambioEmail(req, res) {
  const { id } = req.params;
  const { codigo } = req.body;

  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No tienes autorización para modificar este perfil.' });
  }
  if (req.user.rol !== 'paciente') {
    return res.status(403).json({ error: 'Solo los pacientes pueden cambiar su correo desde aquí.' });
  }

  try {
    const pendiente = await pool.query(
      `SELECT 1 FROM email_change_requests
       WHERE usuario_id = $1 AND codigo_verificacion = $2 AND expira_en > NOW()`,
      [id, codigo]
    );

    if (pendiente.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado.' });
    }

    return res.json({ valid: true });
  } catch (error) {
    console.error('❌ Error validando código de cambio de correo:', error.message);
    return res.status(500).json({ error: 'Error al validar el código.' });
  }
}

// PASO 1B — REENVIAR CÓDIGO (misma solicitud pendiente, código nuevo)
async function reenviarCodigoCambioEmail(req, res) {
  const { id } = req.params;

  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No tienes autorización para modificar este perfil.' });
  }
  if (req.user.rol !== 'paciente') {
    return res.status(403).json({ error: 'Solo los pacientes pueden cambiar su correo desde aquí.' });
  }

  try {
    const pendiente = await pool.query('SELECT nuevo_email, confirmado FROM email_change_requests WHERE usuario_id = $1', [id]);
    if (pendiente.rows.length === 0) {
      return res.status(404).json({ error: 'No hay una solicitud de cambio de correo pendiente.' });
    }
    if (pendiente.rows[0].confirmado) {
      return res.status(400).json({ error: 'Ese cambio ya fue confirmado y está en período de gracia.' });
    }

    const nuevoEmail = pendiente.rows[0].nuevo_email;
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `UPDATE email_change_requests SET codigo_verificacion = $1, expira_en = NOW() + interval '15 minutes' WHERE usuario_id = $2`,
      [codigo, id]
    );

    await notificationService.notificarReenvioCodigoCambioEmail(req.user.nombre, nuevoEmail, codigo);

    return res.json({ message: 'Código reenviado correctamente.' });
  } catch (error) {
    console.error('❌ Error reenviando código de cambio de correo:', error.message);
    return res.status(500).json({ error: 'Error al reenviar el código.' });
  }
}

// PASO 2 DE 2 — CONFIRMAR CAMBIO DE CORREO CON EL CÓDIGO + CONTRASEÑA
// La contraseña es una segunda confirmación real (no solo de UI): sin ella,
// quien deje la sesión abierta en un dispositivo compartido podría cambiar
// el correo de acceso con solo el código ya recibido.
async function confirmarCambioEmail(req, res) {
  const { id } = req.params;
  const { codigo, password } = req.body;

  if (String(req.user.id) !== String(id)) {
    return res.status(403).json({ error: 'No tienes autorización para modificar este perfil.' });
  }
  if (req.user.rol !== 'paciente') {
    return res.status(403).json({ error: 'Solo los pacientes pueden cambiar su correo desde aquí.' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Ingresa tu contraseña para confirmar el cambio.' });
  }

  try {
    const usuarioActual = await pool.query('SELECT password FROM usuarios WHERE id = $1', [id]);
    if (usuarioActual.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const hashActual = usuarioActual.rows[0].password;
    // Compatibilidad con cuentas viejas en texto plano (mismo criterio que
    // login) — bcrypt.compare fallaría contra un hash que no es bcrypt.
    const passwordCorrecta = hashActual.startsWith('$2')
      ? await bcrypt.compare(password, hashActual)
      : password === hashActual;

    if (!passwordCorrecta) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    const pendiente = await pool.query(
      `SELECT nuevo_email FROM email_change_requests
       WHERE usuario_id = $1 AND codigo_verificacion = $2 AND expira_en > NOW()`,
      [id, codigo]
    );

    if (pendiente.rows.length === 0) {
      return res.status(400).json({ error: 'Código inválido o expirado.' });
    }

    const nuevoEmail = pendiente.rows[0].nuevo_email;
    const correoAnterior = req.user.email;

    // Revalida unicidad al confirmar — pudo haberse registrado otra cuenta
    // con ese correo en la ventana de 15 minutos desde que se solicitó.
    const existente = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND id != $2', [nuevoEmail, id]);
    if (existente.rows.length > 0) {
      await pool.query('DELETE FROM email_change_requests WHERE usuario_id = $1', [id]);
      return res.status(409).json({ error: 'Ese correo ya fue tomado por otra cuenta. Solicita el cambio de nuevo.' });
    }

    // No se aplica todavía — queda en período de gracia de 24h. La tarea
    // programada aplicarCambiosEmailPendientes (scheduledTasks.js) hace el
    // UPDATE real de usuarios.email cuando se cumple aplicar_en. Esto le da
    // tiempo al dueño legítimo de cancelarlo cambiando su contraseña
    // (resetPassword borra la fila de email_change_requests).
    const pendienteRow = await pool.query(
      `UPDATE email_change_requests
          SET confirmado = true, aplicar_en = NOW() + interval '24 hours'
        WHERE usuario_id = $1
        RETURNING aplicar_en`,
      [id]
    );
    const fechaAplicacionTexto = new Date(pendienteRow.rows[0].aplicar_en).toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      dateStyle: 'long',
      timeStyle: 'short'
    });

    // Bloqueante — si este aviso no llega, el dueño legítimo no tiene forma
    // de enterarse ni cancelar el cambio antes de que se aplique.
    await notificationService.notificarCambioEmailProgramado(req.user.nombre, correoAnterior, nuevoEmail, fechaAplicacionTexto);

    return res.json({
      message: `Tu correo se cambiará a ${nuevoEmail} en 24 horas. Te enviamos un aviso a tu correo anterior por si no fuiste tú.`,
      scheduled: true,
      aplicarEn: pendienteRow.rows[0].aplicar_en
    });
  } catch (error) {
    console.error('❌ Error confirmando cambio de correo:', error.message);
    return res.status(500).json({ error: 'Error al confirmar el cambio de correo.' });
  }
}

async function updateStatus(req, res) {
  const { id } = req.params;
  const { estado } = req.body;

  try {
    const result = await pool.query('UPDATE usuarios SET status = $1 WHERE id = $2 RETURNING *', [estado, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    const { password: _omitPassword, ...usuarioActualizado } = result.rows[0];

    // Notificación informativa: solo al activar la cuenta
    if (estado === 'activo') {
      notificationService.notificarCuentaAutorizada(
        usuarioActualizado.nombre, usuarioActualizado.email
      );
    }

    res.json(usuarioActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  try {
    // Limpiar registros dependientes antes de eliminar el usuario
    await pool.query('DELETE FROM notas_universitarias WHERE creado_por = $1', [id]);
    await pool.query('DELETE FROM asistencia_practicantes WHERE usuario_id = $1', [id]);
    await pool.query('DELETE FROM refresh_tokens WHERE usuario_id = $1', [id]);

    const result = await pool.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = {
  USUARIO_COLUMNAS_SEGURAS,
  getAll,
  getById,
  updateProfile,
  solicitarCambioEmail,
  reenviarCodigoCambioEmail,
  validarCodigoCambioEmail,
  confirmarCambioEmail,
  updateStatus,
  remove
};
