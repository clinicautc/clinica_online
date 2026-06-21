/**
 * ============================================================================
 * SERVICIO DE NOTIFICACIONES (fachada)
 * Hoy solo envuelve emailService (enviarCorreo/reenviarCorreo). El objetivo es
 * que, cuando exista un canal nuevo (WhatsApp, SMS), se agregue aquí adentro
 * y los controladores que llaman a enviar()/reenviar() no tengan que cambiar.
 * ============================================================================
 */

const { enviarCorreo, reenviarCorreo } = require('./emailService');

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

module.exports = { enviar, reenviar };
