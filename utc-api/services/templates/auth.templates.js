/**
 * ==========================================================
 * PLANTILLAS DE AUTENTICACIÓN
 * Sistema Clínico UTC
 * ==========================================================
 */

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const STYLES = `
<style type="text/css">
  body, table, td { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
  table           { mso-table-lspace:0pt; mso-table-rspace:0pt; }
  @media only screen and (max-width:620px) {
    .email-card   { border-radius:0 !important; }
    .email-header { padding:24px 16px !important; }
    .email-body   { padding:24px 16px !important; }
    .brand-title  { font-size:26px !important; }
    .email-title  { font-size:20px !important; }
    .code-box     { padding:20px 14px !important; }
    .code-number  { font-size:32px !important; letter-spacing:4px !important; }
  }
</style>`;

function crearHtmlCodigoVerificacion(nombre, codigo) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  ${STYLES}
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:20px 10px;">
    <tr>
      <td align="center">

        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">

          <tr>
            <td class="email-header" align="center" style="background:linear-gradient(135deg,#dbeafe,#eff6ff);padding:35px 20px;">
              <h1 class="brand-title" style="margin:0;font-size:34px;font-weight:900;color:#1e3a8a;">Clínica UTC</h1>
              <p style="margin-top:10px;font-size:14px;color:#475569;">Sistema Clínico Universitario</p>
            </td>
          </tr>

          <tr>
            <td class="email-body" style="padding:35px 25px;">

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:28px;line-height:1.3;">Hola, ${nombre} 👋</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Recibimos una solicitud para crear una cuenta dentro del sistema clínico de la Universidad Tres Culturas (UTC).
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="code-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:25px;">
                      <p style="margin:0;color:#64748b;font-size:14px;">Tu código de verificación es:</p>
                      <div class="code-number" style="margin-top:15px;font-size:48px;font-weight:900;letter-spacing:10px;color:#1e3a8a;line-height:1.1;word-break:break-word;">
                        ${codigo}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:30px;">Este código expirará en 15 minutos por motivos de seguridad.</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;">Si tú no realizaste esta solicitud, puedes ignorar este correo.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px 25px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;line-height:1.6;">
                Este es un mensaje automático del portal Clínica UTC para informarte sobre cambios importantes relacionados con tus citas. Por favor, no respondas a este correo.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">Este es un buzón de solo envío, no recibe respuestas.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function crearHtmlRecuperacionPassword(nombre, codigo) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  ${STYLES}
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:20px 10px;">
    <tr>
      <td align="center">

        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">

          <tr>
            <td class="email-header" align="center" style="background:linear-gradient(135deg,#dbeafe,#eff6ff);padding:35px 20px;">
              <h1 class="brand-title" style="margin:0;font-size:34px;font-weight:900;color:#1e3a8a;">Clínica UTC</h1>
              <p style="margin-top:10px;font-size:14px;color:#475569;">Sistema Clínico Universitario</p>
            </td>
          </tr>

          <tr>
            <td class="email-body" style="padding:35px 25px;">

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:28px;line-height:1.3;">Hola, ${nombre} 👋</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Recibimos una solicitud para restablecer tu contraseña en el sistema clínico de la Universidad Tres Culturas (UTC).
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="code-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:25px;">
                      <p style="margin:0;color:#64748b;font-size:14px;">Tu código de recuperación es:</p>
                      <div class="code-number" style="margin-top:15px;font-size:48px;font-weight:900;letter-spacing:10px;color:#1e3a8a;line-height:1.1;word-break:break-word;">
                        ${codigo}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:30px;">Este código expirará en 15 minutos por motivos de seguridad.</p>
              <p style="color:#b91c1c;font-size:14px;line-height:1.7;font-weight:600;">Si tú no realizaste esta solicitud, te recomendamos cambiar tu contraseña de acceso de inmediato — alguien más podría estar intentando entrar a tu cuenta.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px 25px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;line-height:1.6;">
                Este es un mensaje automático del portal Clínica UTC para informarte sobre cambios importantes relacionados con tus citas. Por favor, no respondas a este correo.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">Este es un buzón de solo envío, no recibe respuestas.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function crearHtmlCodigoPrimerInicio(nombre, codigo) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  ${STYLES}
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:20px 10px;">
    <tr>
      <td align="center">

        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">

          <tr>
            <td class="email-header" align="center" style="background:linear-gradient(135deg,#dbeafe,#eff6ff);padding:35px 20px;">
              <h1 class="brand-title" style="margin:0;font-size:34px;font-weight:900;color:#1e3a8a;">Clínica UTC</h1>
              <p style="margin-top:10px;font-size:14px;color:#475569;">Sistema Clínico Universitario</p>
            </td>
          </tr>

          <tr>
            <td class="email-body" style="padding:35px 25px;">

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:28px;line-height:1.3;">Hola, ${nombre} 👋</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Estás configurando tu contraseña de acceso al Sistema Clínico UTC por primera vez. Ingresa el siguiente código para confirmar tu identidad y continuar.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="code-box" style="background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #16a34a;border-radius:12px;padding:25px;">
                      <p style="margin:0;color:#166534;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Tu código de configuración es:</p>
                      <div class="code-number" style="margin-top:15px;font-size:48px;font-weight:900;letter-spacing:10px;color:#14532d;line-height:1.1;word-break:break-word;">
                        ${codigo}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:30px;">Este código expirará en 15 minutos por motivos de seguridad.</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;">Este es un proceso de un solo uso para configurar tu acceso inicial. Si no fuiste tú, comunícate con el administrador de tu área.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px 25px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;line-height:1.6;">
                Este es un mensaje automático del portal Clínica UTC para informarte sobre cambios importantes relacionados con tus citas. Por favor, no respondas a este correo.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">Este es un buzón de solo envío, no recibe respuestas.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function crearHtmlCambioEmail(nombre, codigo) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  ${STYLES}
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:20px 10px;">
    <tr>
      <td align="center">

        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">

          <tr>
            <td class="email-header" align="center" style="background:linear-gradient(135deg,#ffedd5,#fff7ed);padding:35px 20px;">
              <h1 class="brand-title" style="margin:0;font-size:34px;font-weight:900;color:#9a3412;">Clínica UTC</h1>
              <p style="margin-top:10px;font-size:14px;color:#475569;">Sistema Clínico Universitario</p>
            </td>
          </tr>

          <tr>
            <td class="email-body" style="padding:35px 25px;">

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:28px;line-height:1.3;">Hola, ${nombre} 👋</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Recibimos una solicitud para cambiar el correo de acceso de tu cuenta en el sistema clínico de la Universidad Tres Culturas (UTC) a esta dirección.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="code-box" style="background:#fff7ed;border:1px solid #fdba74;border-left:4px solid #ea580c;border-radius:12px;padding:25px;">
                      <p style="margin:0;color:#9a3412;font-size:14px;">Tu código para confirmar el nuevo correo es:</p>
                      <div class="code-number" style="margin-top:15px;font-size:48px;font-weight:900;letter-spacing:10px;color:#9a3412;line-height:1.1;word-break:break-word;">
                        ${codigo}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:30px;">Este código expirará en 15 minutos por motivos de seguridad.</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;">Si tú no realizaste esta solicitud, puedes ignorar este mensaje — esta bandeja no será vinculada a ninguna cuenta.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px 25px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;line-height:1.6;">
                Este es un mensaje automático del portal Clínica UTC para informarte sobre cambios importantes relacionados con tus citas. Por favor, no respondas a este correo.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">Este es un buzón de solo envío, no recibe respuestas.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// Se envía al correo ANTERIOR en cuanto se confirma código+contraseña — el
// cambio real todavía NO se aplicó (queda en período de gracia, ver
// aplicarCambiosEmailPendientes en scheduledTasks.js). El botón de cambiar
// contraseña SÍ funciona aquí, a diferencia del aviso final, porque en este
// momento el correo de acceso todavía es el anterior.
function crearHtmlCambioEmailProgramado(nombre, correoNuevo, fechaAplicacionTexto) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  ${STYLES}
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:20px 10px;">
    <tr>
      <td align="center">

        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">

          <tr>
            <td class="email-header" align="center" style="background:linear-gradient(135deg,#ffedd5,#fff7ed);padding:35px 20px;">
              <h1 class="brand-title" style="margin:0;font-size:34px;font-weight:900;color:#9a3412;">Clínica UTC</h1>
              <p style="margin-top:10px;font-size:14px;color:#475569;">Sistema Clínico Universitario</p>
            </td>
          </tr>

          <tr>
            <td class="email-body" style="padding:35px 25px;">

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:28px;line-height:1.3;">Hola, ${nombre} 👋</h2>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="background:#fff7ed;border:1px solid #fdba74;border-left:4px solid #ea580c;border-radius:12px;padding:20px 25px;">
                      <p style="margin:0;color:#9a3412;font-size:15px;line-height:1.6;">
                        Tu correo de acceso a la Clínica UTC va a cambiar a <strong>${correoNuevo}</strong> el <strong>${fechaAplicacionTexto}</strong>.
                      </p>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:18px 20px;margin-top:20px;">
                <p style="margin:0;color:#991b1b;font-size:14px;line-height:1.6;">
                  <strong>Si tú no solicitaste este cambio:</strong> tu cuenta de la Clínica UTC podría estar comprometida. Cambia tu contraseña ahora mismo con el botón de abajo — esto cancela automáticamente el cambio de correo programado.
                </p>
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:16px 0 0 0;">
                <tr>
                  <td align="center" bgcolor="#dc2626" style="border-radius:8px;">
                    <a href="https://clinicautc.com/forgot-password" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Cambiar mi contraseña</a>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:20px;">Si sí fuiste tú, no necesitas hacer nada — el cambio se aplicará solo en la fecha indicada.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px 25px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;line-height:1.6;">
                Este es un mensaje automático del portal Clínica UTC para informarte sobre cambios importantes relacionados con tu cuenta. Por favor, no respondas a este correo.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">Este es un buzón de solo envío, no recibe respuestas.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// Se envía al correo ANTERIOR (no al nuevo) — es la única forma de que el
// dueño legítimo de la cuenta se entere si alguien más completó el cambio,
// ya que a partir de este correo el acceso ya no funciona con la dirección
// anterior.
function crearHtmlCambioEmailConfirmado(nombre, correoAnterior, correoNuevo, fechaHoraTexto) {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="es">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  ${STYLES}
</head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#ffffff;padding:20px 10px;">
    <tr>
      <td align="center">

        <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.05);border:1px solid #e5e7eb;">

          <tr>
            <td class="email-header" align="center" style="background:linear-gradient(135deg,#dbeafe,#eff6ff);padding:35px 20px;">
              <h1 class="brand-title" style="margin:0;font-size:34px;font-weight:900;color:#1e3a8a;">Clínica UTC</h1>
              <p style="margin-top:10px;font-size:14px;color:#475569;">Sistema Clínico Universitario</p>
            </td>
          </tr>

          <tr>
            <td class="email-body" style="padding:35px 25px;">

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:28px;line-height:1.3;">Hola, ${nombre} 👋</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:20px;">
                Te confirmamos que el correo de acceso de tu cuenta en el sistema clínico de la Universidad Tres Culturas (UTC) fue cambiado exitosamente.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:20px 25px;">
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;"><strong style="color:#334155;">Correo anterior:</strong> ${correoAnterior}</p>
                      <p style="margin:0 0 8px;color:#64748b;font-size:13px;"><strong style="color:#334155;">Correo nuevo:</strong> ${correoNuevo}</p>
                      <p style="margin:0;color:#64748b;font-size:13px;"><strong style="color:#334155;">Fecha y hora:</strong> ${fechaHoraTexto}</p>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:30px;">A partir de ahora, inicia sesión con tu correo nuevo — esta dirección ya no tiene acceso a la cuenta.</p>
              <p style="color:#b91c1c;font-size:14px;line-height:1.7;font-weight:600;">Si tú no realizaste este cambio, contacta de inmediato a la administración de la clínica.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px 25px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
              <p style="margin:0 0 6px;color:#94a3b8;font-size:11px;line-height:1.6;">
                Este es un mensaje automático del portal Clínica UTC para informarte sobre cambios importantes relacionados con tu cuenta. Por favor, no respondas a este correo.
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">Este es un buzón de solo envío, no recibe respuestas.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

module.exports = {
  crearHtmlCodigoVerificacion,
  crearHtmlRecuperacionPassword,
  crearHtmlCodigoPrimerInicio,
  crearHtmlCambioEmail,
  crearHtmlCambioEmailProgramado,
  crearHtmlCambioEmailConfirmado
};
