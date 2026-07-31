/**
 * ==========================================================
 * SERVICIO CENTRAL DE CORREO emailService.js
 * Sistema Clínico UTC
 * ==========================================================
 */
const dns = require('dns');
const pool = require('../db');
const { Resend } = require('resend');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Render (y muchos hosts en contenedores) no tienen salida IPv6 configurada.
// smtp.gmail.com resuelve a direcciones IPv4 e IPv6, y si Node prueba la
// IPv6 primero, la conexión falla de inmediato con ENETUNREACH ("red
// inalcanzable") aunque la IPv4 sí sea alcanzable. Esto fuerza a Node a
// preferir IPv4 en toda resolución DNS del proceso (afecta a Nodemailer,
// que usa dns.lookup internamente para conectar por SMTP).
dns.setDefaultResultOrder('ipv4first');

// Diagnóstico de arranque: confirma en los logs del host (ej. Render) que
// este ajuste realmente quedó activo en el proceso que está corriendo, y
// qué IPs está devolviendo la resolución real de smtp.gmail.com ahí. Si
// aquí aparece "ipv4first" pero igual falla con una IP 2607:f8b0..., el
// problema ya no es DNS — es la red saliente del host bloqueando SMTP.
console.log('[emailService] DNS default order:', dns.getDefaultResultOrder ? dns.getDefaultResultOrder() : 'API no disponible en esta versión de Node');
dns.lookup('smtp.gmail.com', { all: true }, (err, addresses) => {
  if (err) {
    console.error('[emailService] dns.lookup(smtp.gmail.com) falló:', err.message);
    return;
  }
  console.log('[emailService] dns.lookup(smtp.gmail.com) ->', JSON.stringify(addresses));
});

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const transporter = process.env.EMAIL_USER && process.env.EMAIL_PASS
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      // Sin esto, en hosts que bloquean el tráfico saliente por SMTP (ej. el
      // plan gratuito de Render) `sendMail` se queda colgado indefinidamente
      // intentando conectar — la promesa nunca resuelve ni rechaza, así que
      // el controlador nunca responde y el botón del frontend queda
      // cargando para siempre. Con estos timeouts, falla en unos segundos
      // con un error real que sí se propaga (log + 500 al frontend) en vez
      // de colgarse.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    })
  : null;

// OJO: el remitente de Resend y el de Nodemailer NO son intercambiables.
// Resend solo puede enviar desde un dominio verificado en su panel
// (notificaciones@clinicautc.com); Nodemailer solo puede enviar desde la
// cuenta de Gmail autenticada (EMAIL_USER). Compartir un mismo fallback
// entre ambos rompía Resend si EMAIL_FROM no estaba definida (caía en
// EMAIL_USER, una dirección de Gmail no verificada en Resend).
function getResendFromAddress() {
  return process.env.EMAIL_FROM || 'notificaciones@clinicautc.com';
}

function getNodemailerFromAddress() {
  return process.env.EMAIL_USER;
}

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
// ENVÍO POR NODEMAILER
// ==========================================================

// Nota de diseño (ver notificationService.js): estas notificaciones son
// BLOQUEANTES — si el envío falla, la excepción debe propagarse para que
// el controlador responda con error y el usuario sepa que no le llegó el
// código, en vez de ver "enviado con éxito" y quedarse sin poder continuar.
if (proveedor === 'nodemailer') {

  if (!transporter) {
    throw new Error('NodeMailer no configurado (faltan EMAIL_USER/EMAIL_PASS).');
  }

  let info;
  try {
    info = await transporter.sendMail({
      from: `"Clínica UTC" <${getNodemailerFromAddress()}>`,
      to: destino,
      subject: asunto,
      html: html
    });
  } catch (error) {
    console.error(
      `[emailService] NodeMailer falló para ${destino} — code=${error.code || 'N/A'}: ${error.message}`
    );
    throw error;
  }

  console.log(
    'Correo enviado por NodeMailer'
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
        'nodemailer',
        'reenvio_codigo'
      ]
    );

  }

}


// ==========================================================
// ENVÍO FORZADO POR NODEMAILER
// ==========================================================

if (!transporter) {
  throw new Error('NodeMailer no configurado (faltan EMAIL_USER/EMAIL_PASS).');
}

let info;
try {
  info = await transporter.sendMail({
    from: `"Clínica UTC" <${getNodemailerFromAddress()}>`,
    to: destino,
    subject: asunto,
    html: html
  });
} catch (error) {
  console.error(
    `[emailService] NodeMailer (reenvío) falló para ${destino} — code=${error.code || 'N/A'}: ${error.message}`
  );
  throw error;
}

console.log(
  `Correo reenviado por NodeMailer a ${destino}`
);

return info;

}

module.exports = {
  enviarCorreo,
  reenviarCorreo
};
