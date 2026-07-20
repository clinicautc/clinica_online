/**
 * ==========================================================
 * PLANTILLAS DE PERSONAL
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
    .pass-text    { font-size:22px !important; letter-spacing:2px !important; }
    .info-box     { padding:18px 14px !important; }
  }
</style>`;

function crearHtmlCambioPasswordInicial(nombre, passwordTemporal) {
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

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:24px;line-height:1.3;">Configura tu contraseña inicial</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Hola, <strong>${nombre}</strong>. Tu cuenta en el Sistema Clínico UTC ha sido creada. A continuación encontrarás tu <strong>contraseña de acceso inicial</strong> — es de un solo uso y deberás cambiarla al ingresar por primera vez.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="code-box" style="background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #16a34a;border-radius:12px;padding:25px;margin-bottom:25px;">
                      <p style="margin:0 0 8px 0;color:#166534;font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Tu contraseña de primer acceso es:</p>
                      <div class="pass-text" style="font-size:32px;font-weight:900;letter-spacing:4px;color:#14532d;line-height:1.2;word-break:break-all;margin-top:8px;">
                        ${passwordTemporal}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="padding-bottom:10px;vertical-align:top;width:28px;font-size:14px;font-weight:700;color:#16a34a;">1.</td>
                  <td style="padding-bottom:10px;">
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">Inicia sesión en el Sistema Clínico UTC con la contraseña de arriba.</p>
                  </td>
                </tr>
                <tr>
                  <td style="vertical-align:top;width:28px;font-size:14px;font-weight:700;color:#16a34a;">2.</td>
                  <td>
                    <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">El sistema te llevará automáticamente a la pantalla de configuración, donde crearás tu contraseña personal definitiva.</p>
                  </td>
                </tr>
              </table>

              <div class="info-box" style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
                <p style="margin:0;color:#92400e;font-size:14px;line-height:1.6;">
                  <strong>Importante:</strong> Esta contraseña es temporal y de uso único. Si no eres tú quien recibió este correo, comunícate de inmediato con el administrador de tu área.
                </p>
              </div>
              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                PUEDES INICIAR SESIÓN EN EL SISTEMA UTC HACIENDO CLIC EN EL BOTÓN DE ABAJO.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 0 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                    <a href="${FRONTEND_URL}/login" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Iniciar sesión</a>
                  </td>
                </tr>
              </table>

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

function crearHtmlCuentaAutorizada(nombre) {
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

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:24px;line-height:1.3;">Tu cuenta ha sido reactivada ✓</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Hola, <strong>${nombre}</strong>. Un docente o administrador ha reactivado tu cuenta en el Sistema Clínico UTC. Ya puedes iniciar sesión normalmente.
              </p>

              <div class="info-box" style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:18px 20px;margin-bottom:20px;">
                <p style="margin:0;color:#166534;font-size:14px;line-height:1.6;">
                  Tu acceso ha sido restablecido. Si experimentas algún problema para iniciar sesión, contacta al administrador de tu área.
                </p>
              </div>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;">Si crees que este mensaje fue enviado por error, comunícate con el administrador de tu área de inmediato.</p>

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

module.exports = { crearHtmlCambioPasswordInicial, crearHtmlCuentaAutorizada };
