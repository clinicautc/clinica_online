/**
 * ==========================================================
 * PLANTILLAS DE PACIENTES
 * Sistema Clínico UTC
 * ==========================================================
 * Contiene las plantillas de correo relacionadas con:
 *   - Bienvenida al portal (cuenta activada tras verificación)
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
    .info-box     { padding:18px 14px !important; }
  }
</style>`;

function crearHtmlBienvenidaPaciente(nombre) {
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

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:24px;line-height:1.3;">¡Bienvenido ${nombre}!</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Tu cuenta ha sido verificada exitosamente. Ya puedes acceder a tu portal Clínico y utilizar todos los servicios disponibles para pacientes.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="info-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:25px;margin-bottom:20px;">

                      <p style="margin:0 0 16px 0;font-size:14px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:1px;">¿Qué puedes hacer en el portal?</p>

                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:12px;vertical-align:top;width:24px;color:#2563eb;font-size:16px;">✦</td>
                          <td style="padding-bottom:12px;padding-left:8px;">
                            <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">Agendar citas</p>
                            <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">Solicita una cita en el área de <strong>Nutrición</strong> o <strong>Fisioterapia</strong> en el horario que mejor te convenga.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:12px;vertical-align:top;width:24px;color:#2563eb;font-size:16px;">✦</td>
                          <td style="padding-bottom:12px;padding-left:8px;">
                            <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">Consultar tu agenda</p>
                            <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">Revisa tus citas programadas, el profesional de la salud asignado a tu consulta y el estado de cada una en tiempo real.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:12px;vertical-align:top;width:24px;color:#2563eb;font-size:16px;">✦</td>
                          <td style="padding-bottom:12px;padding-left:8px;">
                            <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">Reagendar o cancelar</p>
                            <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">Modifica tus citas cuando lo necesites directamente desde tu panel, sin llamadas ni trámites.</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="vertical-align:top;width:24px;color:#2563eb;font-size:16px;">✦</td>
                          <td style="padding-left:8px;">
                            <p style="margin:0;font-size:15px;font-weight:700;color:#111827;">Ver tus notas clínicas</p>
                            <p style="margin:4px 0 0 0;font-size:14px;color:#6b7280;line-height:1.6;">Accede a las notas y avances de tus consultas anteriores en cualquier momento.</p>
                          </td>
                        </tr>
                      </table>

                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:8px;">Si tienes alguna duda sobre el uso del portal, comunícate directamente con la clínica.</p>

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

module.exports = { crearHtmlBienvenidaPaciente };
