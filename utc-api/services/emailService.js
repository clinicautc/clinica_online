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

const resend = new Resend(process.env.RESEND_API_KEY);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  // Sin esto, en hosts que bloquean el tráfico saliente por SMTP (ej. el
  // plan gratuito de Render) `sendMail` se queda colgado indefinidamente
  // intentando conectar — la promesa nunca resuelve ni rechaza, así que el
  // controlador nunca responde y el botón del frontend queda cargando para
  // siempre. Con estos timeouts, falla en unos segundos con un error real
  // que sí se propaga (log + 500 al frontend) en vez de colgarse.
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});
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
// MOSTRAR PROVEEDOR ELEGIDO
// ==========================================================

console.log(
  `Proveedor seleccionado para ${destino}: ${proveedor}`
);
// ==========================================================
// ENVÍO POR NODEMAILER
// ==========================================================

if (proveedor === 'nodemailer') {

  const info = await transporter.sendMail({

    from: `"Clínica UTC" <${process.env.EMAIL_USER}>`,

    to: destino,

    subject: asunto,

    html: html

  });

  console.log(
    'Correo enviado por NodeMailer'
  );

  return info;

}

// ==========================================================
// ENVÍO POR RESEND
// ==========================================================

if (proveedor === 'resend') {

  const { data, error } =
    await resend.emails.send({

      from: 'Clinica UTC <notificaciones@clinicautc.com>',

      to: [destino],

      subject: asunto,

      html: html

    });

  if (error) {

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
// DOMINIOS PÚBLICOS
// ==========================================================

const dominiosPublicos = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com'
];


// ==========================================================
// AGREGAR A correos_especiales
// ==========================================================

if (!dominiosPublicos.includes(dominio)) {

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

const info = await transporter.sendMail({

  from: `"Clínica UTC" <${process.env.EMAIL_USER}>`,

  to: destino,

  subject: asunto,

  html: html

});

console.log(
  `Correo reenviado por NodeMailer a ${destino}`
);

return info;

}

module.exports = {
  enviarCorreo,
  reenviarCorreo
};