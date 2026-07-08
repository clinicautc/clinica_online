/**
 * Script de limpieza: borra todos los datos clínicos generados durante las pruebas.
 * Conserva: usuarios (contraseñas, perfiles), correos_especiales, horarios_practicas.
 * Ejecutar UNA sola vez con: node utc-api/scripts/limpiar_datos.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db');

async function limpiar() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const pasos = [
      // 1. Archivos de consentimiento (FK a citas con ON DELETE SET NULL — limpiar antes que citas)
      ['consentimientos_informados',  'DELETE FROM consentimientos_informados'],
      // 2. Historiales clínicos
      ['historiales_nutricion',       'DELETE FROM historiales_nutricion'],
      ['historiales_fisioterapia',    'DELETE FROM historiales_fisioterapia'],
      ['historiales_medicos',         'DELETE FROM historiales_medicos'],
      // 3. Notas de evolución y comunicados internos
      ['notas_evolucion',             'DELETE FROM notas_evolucion'],
      ['respuestas_comunicados',      'DELETE FROM respuestas_comunicados'],
      ['notas_universitarias',        'DELETE FROM notas_universitarias'],
      // 4. Métricas, asistencia y logs
      ['metricas',                    'DELETE FROM metricas'],
      ['asistencia_practicantes',     'DELETE FROM asistencia_practicantes'],
      ['logs_sistema',                'DELETE FROM logs_sistema'],
      // 5. Sesiones activas (se regeneran en el próximo login)
      ['refresh_tokens',              'DELETE FROM refresh_tokens'],
      // 6. Citas — citas_auditoria se elimina en cascada (ON DELETE CASCADE)
      ['citas',                       'DELETE FROM citas'],
    ];

    console.log('\n🧹 Iniciando limpieza de datos...\n');
    for (const [nombre, sql] of pasos) {
      const res = await client.query(sql);
      console.log(`  ✓ ${nombre.padEnd(32)} ${res.rowCount} filas eliminadas`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Base de datos limpia. Usuarios, horarios y config de correo intactos.\n');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error — se hizo ROLLBACK. Nada fue eliminado:\n', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

limpiar();
