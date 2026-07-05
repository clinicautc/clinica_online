/**
 * ==========================================================
 * PLANTILLAS DE CITAS
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
    .info-box     { padding:18px 14px !important; }
  }
</style>`;

function _formatearFecha(fecha) {
  let f;
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const [y, m, d] = fecha.split('-').map(Number);
    f = new Date(y, m - 1, d);
  } else {
    f = new Date(fecha);
  }
  return f.toLocaleDateString('es-MX', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}

function _formatearHora(hora) { return String(hora).substring(0, 5); }
function _formatearArea(area) { return area === 'nutricion' ? 'Nutrición' : 'Fisioterapia'; }

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function crearHtmlCitaCreada(nombre, fecha, hora, area, practicanteNombre) {
  const fechaFormateada   = _formatearFecha(fecha);
  const horaFormateada    = _formatearHora(hora);
  const areaFormateada    = _formatearArea(area);
  const filaPracticante   = practicanteNombre
    ? `<tr>
         <td>
           <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">profesional de la salud</p>
           <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#1e3a8a;">${practicanteNombre}</p>
         </td>
       </tr>`
    : '';
  const pieTexto = practicanteNombre
    ? 'Puedes consultar los detalles de tu cita en cualquier momento desde tu panel de paciente.'
    : 'Un profesional de la salud te será asignado próximamente. Puedes consultar el estado de tu cita desde tu panel de paciente.';

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

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:24px;line-height:1.3;">Tu cita ha sido confirmada ✓</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Hola, <strong>${nombre}</strong>. Tu solicitud de cita en el área de <strong>${areaFormateada}</strong> ha sido registrada exitosamente.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="info-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:25px;margin-bottom:20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:12px;">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Área</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#1e3a8a;">${areaFormateada}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:12px;">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Fecha</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${fechaFormateada}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="${practicanteNombre ? 'padding-bottom:12px;' : ''}">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Hora</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${horaFormateada} hrs</p>
                          </td>
                        </tr>
                        ${filaPracticante}
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:20px;">${pieTexto}</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;">Si necesitas cancelar o reagendar tu cita, accede a tu portal con 24 horas de anticipación a tu horario de cita.</p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                    <a href="${FRONTEND_URL}/dashboard" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Accede aquí</a>
                  </td>
                </tr>
              </table>

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

function crearHtmlAsignacionAutomatica(practicanteNombre, pacienteNombre, fecha, hora, area) {
  const fechaFormateada = _formatearFecha(fecha);
  const horaFormateada  = _formatearHora(hora);
  const areaFormateada  = _formatearArea(area);

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

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:24px;line-height:1.3;">Nueva cita asignada</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Hola, <strong>${practicanteNombre}</strong>. Se te ha asignado automáticamente una nueva cita en el área de <strong>${areaFormateada}</strong>.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="info-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:25px;margin-bottom:20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:12px;">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Paciente</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${pacienteNombre}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:12px;">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Fecha</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${fechaFormateada}</p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Hora</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${horaFormateada} hrs</p>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:20px;">Puedes consultar todos los detalles de tu agenda desde tu panel de practicante.</p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                    <a href="${FRONTEND_URL}/dashboard" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Accede aquí</a>
                  </td>
                </tr>
              </table>

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

function crearHtmlReasignacion(pacienteNombre, fecha, hora, nuevoPracticanteNombre, area) {
  const fechaFormateada = _formatearFecha(fecha);
  const horaFormateada  = _formatearHora(hora);
  const areaFormateada  = _formatearArea(area);

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

              <h2 class="email-title" style="margin-top:0;color:#111827;font-size:24px;line-height:1.3;">Actualización sobre tu cita</h2>

              <p style="color:#4b5563;font-size:16px;line-height:1.8;margin-bottom:30px;">
                Hola, <strong>${pacienteNombre}</strong>. Tu profesional de la salud asignado no se encuentra disponible hoy, por lo que tu cita ha sido reasignada automáticamente.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div class="info-box" style="background:#f8fafc;border:1px solid #e2e8f0;border-left:4px solid #2563eb;border-radius:12px;padding:25px;margin-bottom:20px;">
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding-bottom:12px;">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Área</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#1e3a8a;">${areaFormateada}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:12px;">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Nuevo profesional de la salud</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#1e3a8a;">${nuevoPracticanteNombre}</p>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding-bottom:12px;">
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Fecha</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${fechaFormateada}</p>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <p style="margin:0;font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Hora</p>
                            <p style="margin:4px 0 0 0;font-size:16px;font-weight:700;color:#111827;">${horaFormateada} hrs</p>
                          </td>
                        </tr>
                      </table>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin-top:20px;">Tu cita se llevará a cabo en el mismo horario. No es necesario que realices ninguna acción adicional.</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;">Si tienes alguna duda, comunícate con la clínica o accede a tu portal.</p>

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0 0 0;">
                <tr>
                  <td align="center" bgcolor="#2563eb" style="border-radius:8px;">
                    <a href="${FRONTEND_URL}/dashboard" target="_blank" style="display:inline-block;padding:12px 28px;font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;">Accede aquí</a>
                  </td>
                </tr>
              </table>

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

module.exports = { crearHtmlCitaCreada, crearHtmlAsignacionAutomatica, crearHtmlReasignacion };
