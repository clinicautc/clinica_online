// Lee el código de verificación directo de la BD para completar el flujo de
// "olvidé mi contraseña" en pruebas automatizadas, sin acceso al correo real.
const path = require('path');
require(path.join(__dirname, '..', 'utc-api', 'node_modules', 'dotenv')).config({ path: path.join(__dirname, '..', 'utc-api', '.env') });
const { Pool } = require(path.join(__dirname, '..', 'utc-api', 'node_modules', 'pg'));

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const email = process.argv[2];

(async () => {
  const r = await pool.query(
    'SELECT codigo_verificacion FROM password_resets WHERE email = $1 ORDER BY expira_en DESC LIMIT 1',
    [email]
  );
  console.log(r.rows[0]?.codigo_verificacion ?? 'NO_ENCONTRADO');
  await pool.end();
})();
