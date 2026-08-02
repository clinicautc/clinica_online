const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function main() {
  const tablesRes = await pool.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  let out = '-- Snapshot de esquema generado desde la BD real (columnas + constraints + indices)\n';
  out += '-- Generado: ' + new Date().toISOString() + '\n\n';

  for (const { table_name } of tablesRes.rows) {
    out += '-- ============================================================\n';
    out += '-- TABLA: ' + table_name + '\n';
    out += '-- ============================================================\n';
    out += 'CREATE TABLE ' + table_name + ' (\n';

    const colsRes = await pool.query(`
      SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table_name]);

    const colLines = colsRes.rows.map(c => {
      let type = c.data_type;
      if (c.character_maximum_length) type += '(' + c.character_maximum_length + ')';
      let line = '  ' + c.column_name + ' ' + type;
      if (c.is_nullable === 'NO') line += ' NOT NULL';
      if (c.column_default) line += ' DEFAULT ' + c.column_default;
      return line;
    });
    out += colLines.join(',\n') + '\n);\n\n';

    const consRes = await pool.query(`
      SELECT conname, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid = (quote_ident($1))::regclass
      ORDER BY conname
    `, [table_name]);
    if (consRes.rows.length) {
      out += '-- Constraints:\n';
      for (const c of consRes.rows) {
        out += 'ALTER TABLE ' + table_name + ' ADD CONSTRAINT ' + c.conname + ' ' + c.def + ';\n';
      }
      out += '\n';
    }

    const idxRes = await pool.query(`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1
      ORDER BY indexname
    `, [table_name]);
    if (idxRes.rows.length) {
      out += '-- Indices:\n';
      for (const i of idxRes.rows) {
        out += i.indexdef + ';\n';
      }
      out += '\n';
    }
    out += '\n';
  }

  const outPath = path.join(__dirname, 'schema-snapshot', 'schema.sql');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, out);
  console.log('OK, tablas procesadas:', tablesRes.rows.length, '->', outPath);
  process.exit(0);
}

main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
