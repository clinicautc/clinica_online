/**
 * ==========================================================
 * SERVICIO CENTRAL DE CORREO emailService.js
 * Sistema Clínico UTC
 * ==========================================================
 */
const pool = require('../db');
const { Resend } = require('resend');
require('dotenv').config();

// ==========================================================================
// [DESACTIVADO — reemplazado por Gmail API OAuth2] NODEMAILER / SMTP
//
// Motivo: Render bloquea el tráfico saliente a los puertos SMTP (25/465/587)
// en los servicios gratuitos desde septiembre de 2025. transporter.sendMail()
// nunca lograba completar la conexión desde producción (ENETUNREACH /
// ETIMEDOUT), confirmado con pruebas reales contra varias cuentas
// @edu.utc.mx. Localmente sí funcionaba porque ese bloqueo no existe fuera
// de Render — por eso nunca se veía el problema en desarrollo.
//
// Este bloque se conserva completo, solo comentado, como respaldo histórico.
// No se borró ninguna función.
//
// Está diseñado para ser 100% intercambiable con el bloque [NUEVO] de más
// abajo: los dos definen una función con el MISMO nombre,
// enviarPorGmailAPI(destino, asunto, html) — por eso aquí abajo se llama así
// aunque por dentro use Nodemailer/SMTP, no la API de Gmail; es a propósito,
// para que enviarCorreo()/reenviarCorreo() nunca tengan que cambiar la
// llamada. El valor 'gmail' en correos_especiales.proveedor tampoco necesita
// tocarse — es solo una etiqueta de routing ("dominio institucional"), no
// dice qué motor está activo por dentro.
//
// PARA RESTAURAR NODEMAILER/SMTP: comenta el bloque "[NUEVO] GMAIL API
// OAuth2" de abajo y descomenta este bloque completo. Nada más — ningún
// otro archivo ni línea necesita cambiar.
// ==========================================================================
//
// const dns = require('dns');
// const nodemailer = require('nodemailer');
//
// // Render (y muchos hosts en contenedores) no tienen salida IPv6 configurada.
// // Esto fuerza a Node a preferir IPv4 en toda resolución DNS del proceso.
// dns.setDefaultResultOrder('ipv4first');
//
// const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
//   ? nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS
//       },
//       // Sin esto, en hosts que bloquean el tráfico saliente por SMTP
//       // `sendMail` se queda colgado indefinidamente intentando conectar.
//       connectionTimeout: 10000,
//       greetingTimeout: 10000,
//       socketTimeout: 10000,
//     })
//   : null;
//
// // Mismo nombre que la función activa en el bloque [NUEVO] — ver nota de
// // arriba. Recibe lo mismo (destino, asunto, html) y se comporta igual:
// // devuelve la respuesta si sale bien, lanza excepción si falla.
// async function enviarPorGmailAPI(destino, asunto, html) {
//   if (!transporter) {
//     throw new Error('NodeMailer no configurado (faltan EMAIL_USER/EMAIL_PASS).');
//   }
//   try {
//     return await transporter.sendMail({
//       from: `"Clínica UTC" <${getNodemailerFromAddress()}>`,
//       to: destino,
//       subject: asunto,
//       html: html
//     });
//   } catch (error) {
//     console.error(`[emailService] NodeMailer falló para ${destino} — code=${error.code || 'N/A'}: ${error.message}`);
//     throw error;
//   }
// }
//
// ==========================================================================
// [FIN DESACTIVADO — NODEMAILER / SMTP]
// ==========================================================================

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// OJO: el remitente de Resend y el de Gmail NO son intercambiables.
// Resend solo puede enviar desde un dominio verificado en su panel
// (notificaciones@clinicautc.com); la API de Gmail solo puede enviar desde
// la cuenta autenticada por OAuth2 (EMAIL_USER).
function getResendFromAddress() {
  return process.env.EMAIL_FROM || 'notificaciones@clinicautc.com';
}

// Se conserva el mismo nombre de función que usaba Nodemailer — sigue
// devolviendo la misma cuenta (EMAIL_USER), ahora reutilizada como
// remitente de la API de Gmail en vez de como usuario de SMTP.
function getNodemailerFromAddress() {
  return process.env.EMAIL_USER;
}

// ==========================================================================
// [NUEVO — reemplaza a Nodemailer] GMAIL API OAuth2 (REST, vía fetch)
//
// Envía el correo institucional usando la API oficial de Gmail
// (gmail.users.messages.send) autenticando con OAuth2 — es HTTPS puro,
// no abre ninguna conexión SMTP, así que no le afecta el bloqueo de puertos
// de Render. Implementado con `fetch` nativo de Node, sin instalar la
// librería `googleapis` (evita ~223 MB de dependencias para una sola
// llamada).
//
// Renueva el access token automáticamente en cada envío usando el refresh
// token guardado en GMAIL_OAUTH_REFRESH_TOKEN — no requiere intervención
// manual ni hay tokens de larga duración que expiren silenciosamente.
//
// PARA REVERTIR A NODEMAILER/SMTP: comenta este bloque completo (hasta
// "[FIN NUEVO]") y descomenta el bloque [DESACTIVADO] al inicio del
// archivo — ambos definen enviarPorGmailAPI() con el mismo nombre, así que
// no hace falta cambiar nada más (ver la nota completa en ese bloque).
// ==========================================================================

async function obtenerGmailAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: (process.env.GMAIL_OAUTH_CLIENT_ID || '').trim(),
      client_secret: (process.env.GMAIL_OAUTH_CLIENT_SECRET || '').trim(),
      refresh_token: (process.env.GMAIL_OAUTH_REFRESH_TOKEN || '').trim(),
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`No se pudo renovar el token de Gmail: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

// Codifica un valor de encabezado con caracteres no-ASCII (acentos, ñ) en
// el formato "encoded-word" que exige RFC 2047. Sin esto, encabezados como
// "From" con "í"/"ñ" viajan como bytes UTF-8 crudos dentro de un encabezado
// que se espera ASCII — el resultado es que algún punto de la cadena de
// entrega (o el cliente de correo) los reinterpreta con otra codificación
// y se ven como "ClÃƒÂ­nica UTC" en vez de "Clínica UTC". El Subject ya se
// codificaba así.
function codificarEncabezadoUTF8(texto) {
  return `=?UTF-8?B?${Buffer.from(texto, 'utf-8').toString('base64')}?=`;
}

function construirMensajeGmailBase64(destino, asunto, html) {
  const remitenteCodificado = codificarEncabezadoUTF8('Clínica UTC');
  const asuntoCodificado = codificarEncabezadoUTF8(asunto);

  const mensaje = [
    `From: ${remitenteCodificado} <${getNodemailerFromAddress()}>`,
    `To: ${destino}`,
    `Subject: ${asuntoCodificado}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html
  ].join('\r\n');

  // La API de Gmail exige base64url (no base64 normal): "+"→"-", "/"→"_",
  // sin relleno "=" al final.
  return Buffer.from(mensaje, 'utf-8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Reemplaza directamente a transporter.sendMail(...): misma entrada
// (destinatario, asunto, html), mismo comportamiento hacia el resto del
// sistema — devuelve la respuesta si el envío sale bien, lanza una
// excepción si falla (para que enviarCorreo()/reenviarCorreo() sigan
// propagando el error exactamente igual que antes).
async function enviarPorGmailAPI(destino, asunto, html) {
  const accessToken = await obtenerGmailAccessToken();
  const raw = construirMensajeGmailBase64(destino, asunto, html);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ raw })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Gmail API falló: ${data.error?.message || response.status}`);
  }

  return data;
}

// ==========================================================================
// [FIN NUEVO — GMAIL API OAuth2]
// ==========================================================================

// Dominios de correo público/conocido. Nunca deben quedar mapeados a un
// proveedor distinto de Resend en enviarCorreo() — ver el guard más abajo.
// reenviarCorreo() también usa esta lista para no insertarlos jamás en
// correos_especiales (ese INSERT es solo para dominios institucionales).
const DOMINIOS_PUBLICOS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com'
];

async function enviarCorreo(destino, asunto, html) {

    // ==========================================================
// OBTENER DOMINIO DEL DESTINATARIO
// ==========================================================

const dominio = destino
  .trim()
  .toLowerCase()
  .split('@')[1];


// ==========================================================
// CONSULTAR TABLA correos_especiales
// ==========================================================

const resultado = await pool.query(
  `
  SELECT *
  FROM correos_especiales
  WHERE dominio = $1
  `,
  [dominio]
);

// ==========================================================
// DETERMINAR PROVEEDOR DE CORREO
// ==========================================================

let proveedor = 'resend';

if (resultado.rows.length > 0) {

  proveedor = resultado.rows[0].proveedor;

}

// ==========================================================
// GUARD: dominios públicos nunca deben salir por otra vía que no
// sea Resend, sin importar lo que diga la tabla. Protege contra
// filas insertadas a mano por fuera del código (ya pasó una vez
// con hotmail.com) — correos_especiales solo debe tener dominios
// institucionales.
// ==========================================================

if (DOMINIOS_PUBLICOS.includes(dominio) && proveedor !== 'resend') {

  console.warn(
    `[emailService] ${dominio} es un dominio público pero está mapeado a "${proveedor}" en correos_especiales. Forzando Resend.`
  );

  proveedor = 'resend';

}

// ==========================================================
// MOSTRAR PROVEEDOR ELEGIDO
// ==========================================================

console.log(
  `Proveedor seleccionado para ${destino}: ${proveedor}`
);
// ==========================================================
// ENVÍO POR NODEMAILER  →  ahora vía Gmail API OAuth2
// ==========================================================

// Nota de diseño (ver notificationService.js): estas notificaciones son
// BLOQUEANTES — si el envío falla, la excepción debe propagarse para que
// el controlador responda con error y el usuario sepa que no le llegó el
// código, en vez de ver "enviado con éxito" y quedarse sin poder continuar.
//
// El valor 'gmail' en correos_especiales.proveedor (antes 'nodemailer') es
// solo una etiqueta de routing — significa "dominio institucional", sin
// importar qué motor lo implemente por dentro. Si algún día se restaura el
// bloque [DESACTIVADO] de Nodemailer/SMTP, cambia este comparador de vuelta
// a 'nodemailer' (o al valor que uses) para que coincida con lo que insertes
// en la tabla.
if (proveedor === 'gmail') {

  let info;
  try {
    // Antes: transporter.sendMail(...) (Nodemailer/SMTP — bloqueado en Render).
    // Ahora: enviarPorGmailAPI(...) (Gmail API OAuth2 por HTTPS).
    // Ver bloques [DESACTIVADO]/[NUEVO] al inicio del archivo.
    info = await enviarPorGmailAPI(destino, asunto, html);
  } catch (error) {
    console.error(
      `[emailService] Gmail API falló para ${destino}: ${error.message}`
    );
    throw error;
  }

  console.log(
    'Correo enviado por Gmail API (OAuth2)'
  );

  return info;

}

// ==========================================================
// ENVÍO POR RESEND
// ==========================================================

if (proveedor === 'resend') {

  if (!resend) {
    throw new Error('Resend no configurado (falta RESEND_API_KEY).');
  }

  const { data, error } =
    await resend.emails.send({

      from: `Clinica UTC <${getResendFromAddress()}>`,

      to: [destino],

      subject: asunto,

      html: html

    });

  if (error) {

    console.error(
      `[emailService] Resend falló para ${destino}: ${error.message || error}`
    );

    throw error;

  }

  console.log(
    'Correo enviado por Resend'
  );

  return data;

}


}

async function reenviarCorreo(destino, asunto, html) {

// ==========================================================
// OBTENER DOMINIO
// ==========================================================

const dominio = destino
  .trim()
  .toLowerCase()
  .split('@')[1];


// ==========================================================
// AGREGAR A correos_especiales
// ==========================================================

if (!DOMINIOS_PUBLICOS.includes(dominio)) {

  const existe = await pool.query(
    `
    SELECT *
    FROM correos_especiales
    WHERE dominio = $1
    `,
    [dominio]
  );

  if (existe.rows.length === 0) {

    await pool.query(
      `
      INSERT INTO correos_especiales
      (dominio, proveedor, origen)
      VALUES ($1, $2, $3)
      `,
      [
        dominio,
        'gmail',
        'reenvio_codigo'
      ]
    );

  }

}


// ==========================================================
// ENVÍO FORZADO POR NODEMAILER  →  ahora vía Gmail API OAuth2
// ==========================================================

let info;
try {
  // Antes: transporter.sendMail(...) (Nodemailer/SMTP — bloqueado en Render).
  // Ahora: enviarPorGmailAPI(...) (Gmail API OAuth2 por HTTPS).
  info = await enviarPorGmailAPI(destino, asunto, html);
} catch (error) {
  console.error(
    `[emailService] Gmail API (reenvío) falló para ${destino}: ${error.message}`
  );
  throw error;
}

console.log(
  `Correo reenviado por Gmail API (OAuth2) a ${destino}`
);

return info;

}

module.exports = {
  enviarCorreo,
  reenviarCorreo
};
