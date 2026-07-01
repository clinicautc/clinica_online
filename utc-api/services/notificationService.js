/**
 * ============================================================================
 * SERVICIO DE NOTIFICACIONES
 * Sistema Clínico UTC
 * ============================================================================
 * Fachada central del sistema de notificaciones.
 *
 * Responsabilidades:
 *   - Exponer una API orientada a eventos del negocio.
 *   - Seleccionar la plantilla y el asunto correctos para cada evento.
 *   - Delegar el transporte exclusivamente a emailService.
 *
 * Lo que este servicio NO hace:
 *   - No conoce Resend ni Nodemailer.
 *   - No consulta correos_especiales.
 *   - No decide qué proveedor de correo usar.
 *   - No construye lógica de transporte.
 *
 * Política de errores:
 *   - Eventos BLOQUEANTES: propagan la excepción al controlador.
 *     El flujo del usuario no puede continuar sin la notificación.
 *   - Eventos INFORMATIVOS: absorben el error internamente y lo registran.
 *     La operación principal ya fue exitosa y no debe revertirse.
 * ============================================================================
 */

const { enviarCorreo, reenviarCorreo } = require('./emailService');

// ==========================================================
// PLANTILLAS POR DOMINIO
// ==========================================================

const {
  crearHtmlCodigoVerificacion,
  crearHtmlRecuperacionPassword,
  crearHtmlCodigoPrimerInicio
} = require('./templates/auth.templates');

const {
  crearHtmlCitaCreada,
  crearHtmlAsignacionAutomatica,
  crearHtmlReasignacion
} = require('./templates/citas.templates');

const {
  crearHtmlCambioPasswordInicial,
  crearHtmlCuentaAutorizada
} = require('./templates/personal.templates');

const {
  crearHtmlBienvenidaPaciente
} = require('./templates/pacientes.templates');

// ==========================================================
// MÉTODOS LEGADOS — mantenidos por compatibilidad
// Los controladores de autenticación ya no los llaman directamente,
// pero permanecen exportados para no romper llamadas existentes.
// ==========================================================

async function enviar({ canal = 'email', destino, asunto, html }) {
  if (canal === 'email') {
    return enviarCorreo(destino, asunto, html);
  }

  throw new Error(`Canal de notificación no soportado: ${canal}`);
}

async function reenviar({ canal = 'email', destino, asunto, html }) {
  if (canal === 'email') {
    return reenviarCorreo(destino, asunto, html);
  }

  throw new Error(`Canal de notificación no soportado: ${canal}`);
}

// ==========================================================
// NOTIFICACIONES DE AUTENTICACIÓN — BLOQUEANTES
// Si el envío falla se propaga la excepción. El usuario no puede
// continuar el flujo sin haber recibido el correo.
// ==========================================================

async function notificarCodigoVerificacion(nombre, email, codigo) {
  const html = crearHtmlCodigoVerificacion(nombre, codigo);
  return enviarCorreo(email, 'Código de Verificación - Clínica UTC', html);
}

async function notificarReenvioCodigoVerificacion(nombre, email, codigo) {
  const html = crearHtmlCodigoVerificacion(nombre, codigo);
  return reenviarCorreo(email, 'Código de Verificación - Clínica UTC', html);
}

async function notificarRecuperacionPassword(nombre, email, codigo) {
  const html = crearHtmlRecuperacionPassword(nombre, codigo);
  return enviarCorreo(email, 'Recuperación de contraseña - Clínica UTC', html);
}

async function notificarReenvioRecuperacionPassword(nombre, email, codigo) {
  const html = crearHtmlRecuperacionPassword(nombre, codigo);
  return reenviarCorreo(email, 'Recuperación de contraseña - Clínica UTC', html);
}

async function notificarCodigoPrimerInicio(nombre, email, codigo) {
  const html = crearHtmlCodigoPrimerInicio(nombre, codigo);
  return enviarCorreo(email, 'Código de configuración inicial · Clínica UTC', html);
}

async function notificarReenvioCodigoPrimerInicio(nombre, email, codigo) {
  const html = crearHtmlCodigoPrimerInicio(nombre, codigo);
  return reenviarCorreo(email, 'Código de configuración inicial · Clínica UTC', html);
}

// ==========================================================
// NOTIFICACIONES DE PERSONAL — BLOQUEANTE
// Se envía al momento de crear la cuenta. Si falla, el practicante
// o docente no conoce sus credenciales iniciales y no puede acceder
// al sistema. Por eso se trata como bloqueante.
// ==========================================================

async function notificarCambioPasswordInicial(nombre, email, passwordTemporal) {
  const html = crearHtmlCambioPasswordInicial(nombre, passwordTemporal);
  return enviarCorreo(email, 'Configura tu acceso inicial · Clínica UTC', html);
}

// ==========================================================
// NOTIFICACIONES DE CITAS — INFORMATIVAS
// La cita ya existe en base de datos. Si el correo falla, la
// operación principal no se revierte. El error se registra en
// consola. Integración con logs_sistema pendiente.
// ==========================================================

async function notificarCitaCreada(pacienteNombre, pacienteEmail, fecha, hora, area, practicanteNombre) {
  try {
    const html = crearHtmlCitaCreada(pacienteNombre, fecha, hora, area, practicanteNombre);
    await enviarCorreo(pacienteEmail, 'Confirmación de cita - Clínica UTC', html);
  } catch (error) {
    console.error('[notificaciones] Error al notificar cita creada:', error.message);
  }
}

async function notificarAsignacionAutomatica(practicanteNombre, practicanteEmail, pacienteNombre, fecha, hora, area) {
  try {
    const html = crearHtmlAsignacionAutomatica(practicanteNombre, pacienteNombre, fecha, hora, area);
    await enviarCorreo(practicanteEmail, 'Cita asignada - Clínica UTC', html);
  } catch (error) {
    console.error('[notificaciones] Error al notificar asignación automática:', error.message);
  }
}

async function notificarReasignacion(pacienteNombre, pacienteEmail, fecha, hora, nuevoPracticanteNombre) {
  try {
    const html = crearHtmlReasignacion(pacienteNombre, fecha, hora, nuevoPracticanteNombre);
    await enviarCorreo(pacienteEmail, 'Actualización sobre tu cita - Clínica UTC', html);
  } catch (error) {
    console.error('[notificaciones] Error al notificar reasignación:', error.message);
  }
}

// ==========================================================
// NOTIFICACIONES DE PACIENTES — INFORMATIVA
// ==========================================================

async function notificarBienvenidaPaciente(nombre, email) {
  try {
    const html = crearHtmlBienvenidaPaciente(nombre);
    await enviarCorreo(email, 'Bienvenido - Clínica UTC', html);
  } catch (error) {
    console.error('[notificaciones] Error al notificar bienvenida paciente:', error.message);
  }
}

// ==========================================================
// NOTIFICACIONES DE PERSONAL — INFORMATIVA
// ==========================================================

async function notificarCuentaAutorizada(nombre, email) {
  try {
    const html = crearHtmlCuentaAutorizada(nombre);
    await enviarCorreo(email, 'Tu cuenta ha sido activada - Clínica UTC', html);
  } catch (error) {
    console.error('[notificaciones] Error al notificar cuenta autorizada:', error.message);
  }
}

// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
  // Legados (compatibilidad)
  enviar,
  reenviar,

  // Autenticación — bloqueantes
  notificarCodigoVerificacion,
  notificarReenvioCodigoVerificacion,
  notificarRecuperacionPassword,
  notificarReenvioRecuperacionPassword,

  // Autenticación — primer inicio
  notificarCodigoPrimerInicio,
  notificarReenvioCodigoPrimerInicio,

  // Personal — bloqueante
  notificarCambioPasswordInicial,

  // Citas — informativas
  notificarCitaCreada,
  notificarAsignacionAutomatica,
  notificarReasignacion,

  // Pacientes — informativa
  notificarBienvenidaPaciente,

  // Personal — informativa
  notificarCuentaAutorizada
};
