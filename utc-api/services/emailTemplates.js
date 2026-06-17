/**
 * ==========================================================
 * PLANTILLAS DE CORREO
 * Sistema Clínico UTC
 * ==========================================================
 */

function crearHtmlCodigoVerificacion(nombre, codigo) {

  return `
<div style="margin:0;padding:0;background-color:#ffffff;font-family:Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 10px;background:#ffffff;">
    <tr>
      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" style="
          max-width:600px;
          background:#ffffff;
          border-radius:18px;
          overflow:hidden;
          box-shadow:0 2px 10px rgba(0,0,0,0.05);
          border:1px solid #e5e7eb;
        ">

          <tr>
            <td align="center" style="
              background:linear-gradient(135deg,#dbeafe,#eff6ff);
              padding:35px 20px;
            ">

              <h1 style="
                margin:0;
                font-size:34px;
                font-weight:900;
                color:#1e3a8a;
              ">
                Clínica UTC
              </h1>

              <p style="
                margin-top:10px;
                font-size:14px;
                color:#475569;
              ">
                Sistema Clínico Universitario
              </p>

            </td>
          </tr>

          <tr>
            <td style="padding:35px 25px;">

              <h2 style="
                margin-top:0;
                color:#111827;
                font-size:28px;
                line-height:1.3;
              ">
                Hola, ${nombre} 👋
              </h2>

              <p style="
                color:#4b5563;
                font-size:16px;
                line-height:1.8;
                margin-bottom:30px;
              ">
                Recibimos una solicitud para crear una cuenta dentro del sistema clínico de la Universidad Tres Culturas (UTC).
              </p>

              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">

                    <div style="
                      background:#eff6ff;
                      border:2px solid #2563eb;
                      border-radius:18px;
                      padding:30px 15px;
                    ">

                      <p style="
                        margin:0;
                        color:#64748b;
                        font-size:14px;
                      ">
                        Tu código de verificación es:
                      </p>

                      <div style="
                        margin-top:15px;
                        font-size:48px;
                        font-weight:900;
                        letter-spacing:10px;
                        color:#1e3a8a;
                        line-height:1.1;
                        word-break:break-word;
                      ">
                        ${codigo}
                      </div>

                    </div>

                  </td>
                </tr>
              </table>

              <p style="
                color:#6b7280;
                font-size:14px;
                line-height:1.7;
                margin-top:30px;
              ">
                Este código expirará en 15 minutos por motivos de seguridad.
              </p>

              <p style="
                color:#6b7280;
                font-size:14px;
                line-height:1.7;
              ">
                Si tú no realizaste esta solicitud, puedes ignorar este correo.
              </p>

            </td>
          </tr>

          <tr>
            <td align="center" style="
              background:#ffffff;
              border-top:1px solid #e5e7eb;
              padding:20px;
            ">

              <p style="
                margin:0;
                color:#94a3b8;
                font-size:12px;
              ">
                Clínica UTC · Sistema Institucional
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</div>
`;
}

/**
 * ==========================================================
 * RECUPERACIÓN DE CONTRASEÑA
 * ==========================================================
 */

function crearHtmlRecuperacionPassword(nombre, codigo) {

  return   `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
          overflow: hidden;
        ">

          <div style="
            background: linear-gradient(135deg, #1e3a8a, #2563eb);
            padding: 30px;
            text-align: center;
          ">
            <h1 style="
              color: white;
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            ">
              Clínica UTC
            </h1>
          </div>

          <div style="padding: 40px 30px;">

            <h2 style="
              color: #1e3a8a;
              margin-top: 0;
            ">
              Recuperación de contraseña
            </h2>

            <p style="
              color: #374151;
              font-size: 16px;
              line-height: 1.6;
            ">
              Recibimos una solicitud para restablecer tu contraseña.
            </p>

            <div style="
              background: #eff6ff;
              border: 2px solid #2563eb;
              border-radius: 16px;
              padding: 25px;
              text-align: center;
              margin: 30px 0;
            ">
              <p style="
                margin: 0 0 10px 0;
                color: #1e3a8a;
                font-weight: bold;
              ">
                Tu código de recuperación es:
              </p>

              <div style="
                font-size: 42px;
                font-weight: bold;
                letter-spacing: 8px;
                color: #ea580c;
              ">
                ${codigo}
              </div>
            </div>

            <p style="
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
            ">
              Este código expirará en 15 minutos.
            </p>

          </div>
        </div>
      `;
}

module.exports = {
  crearHtmlCodigoVerificacion,
  crearHtmlRecuperacionPassword
};