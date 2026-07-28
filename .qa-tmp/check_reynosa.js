require('dotenv').config({ path: __dirname + '/../utc-api/.env' });
const pool = require('../utc-api/db');
(async () => {
  const u = await pool.query("SELECT id, nombre, email, rol, area FROM usuarios WHERE email ILIKE $1", ['%f.reynosa.v023%']);
  console.log('USUARIO:', JSON.stringify(u.rows, null, 2));
  if (u.rows.length) {
    const id = u.rows[0].id;
    const citas = await pool.query("SELECT id, tipo, fecha, hora, estado, fecha_creacion, fecha_asignacion, practicante_id, practicante_nombre, recordatorio_enviado FROM citas WHERE paciente_id = $1 ORDER BY fecha_creacion DESC LIMIT 20", [id]);
    console.log('CITAS:', JSON.stringify(citas.rows, null, 2));
  }
  const dom = await pool.query("SELECT * FROM correos_especiales WHERE dominio = 'edu.utc.mx'");
  console.log('CORREOS_ESPECIALES edu.utc.mx:', JSON.stringify(dom.rows, null, 2));
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
