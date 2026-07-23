const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  keepAlive: true,
  // Render Postgres está en Oregon: reconectar en frío tarda ~7s (handshake TCP+SSL).
  // Con el default de 10s, cualquier hueco entre peticiones fuerza esa reconexión.
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000
});

module.exports = pool;