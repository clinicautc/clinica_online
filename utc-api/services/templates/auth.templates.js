/**
 * ==========================================================
 * PLANTILLAS DE AUTENTICACIÓN
 * Sistema Clínico UTC
 * ==========================================================
 */

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
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
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
              <p style="color:#6b7280;font-size:14px;line-height:1.7;">Si tú no realizaste esta solicitud, puedes ignorar este correo.</p>

            </td>
          </tr>

          <tr>
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
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
            <td align="center" style="background:#ffffff;border-top:1px solid #e5e7eb;padding:20px;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">Clínica UTC · Sistema Institucional</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

module.exports = { crearHtmlCodigoVerificacion, crearHtmlRecuperacionPassword, crearHtmlCodigoPrimerInicio };
