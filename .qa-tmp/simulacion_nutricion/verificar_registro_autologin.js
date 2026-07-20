const { chromium } = require('playwright');
const path = require('path');
require(path.join(__dirname, '../../utc-api/node_modules/dotenv')).config({ path: path.join(__dirname, '../../utc-api/.env') });
const pool = require(path.join(__dirname, '../../utc-api/db'));

const TEST_EMAIL = 'qa.registro.autologin.test@example.com';

(async () => {
  // Limpieza previa por si quedó basura de una corrida anterior
  await pool.query('DELETE FROM registro_temporal WHERE email = $1', [TEST_EMAIL]);
  await pool.query('DELETE FROM usuarios WHERE email = $1', [TEST_EMAIL]);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('console', (msg) => console.log('CONSOLE', msg.type().toUpperCase(), msg.text()));
  page.on('response', (res) => { if (res.url().includes('/api/')) console.log('RESP', res.status(), res.url()); });

  await page.goto('http://localhost:5173/register');
  await page.fill('#nombre', 'QA');
  await page.fill('#apellido', 'Autologin');
  await page.fill('#email', TEST_EMAIL);
  await page.fill('#password', 'Prueba123!');
  await page.fill('#confirmPassword', 'Prueba123!');
  await page.waitForTimeout(300);
  const btn = page.locator('button', { hasText: 'Enviar código al correo' });
  console.log('botón deshabilitado?', await btn.isDisabled());
  console.log('count matches:', await btn.count());
  await btn.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'debug_antes_click.png') });
  await btn.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'debug_despues_click.png') });
  console.log('body error text:', await page.locator('.text-red-800').allTextContents());

  const codeRow = await pool.query(
    'SELECT codigo_verificacion FROM registro_temporal WHERE email = $1 ORDER BY id DESC LIMIT 1',
    [TEST_EMAIL]
  );
  if (codeRow.rows.length === 0) throw new Error('No se generó registro_temporal para el email de prueba.');
  const code = codeRow.rows[0].codigo_verificacion;
  console.log('Código obtenido de la BD:', code);

  await page.fill('#code', code);
  await page.click('text=Registrarse en la clínica');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  await page.waitForTimeout(1500);

  const url = page.url();
  const bodyText = await page.textContent('body');
  const parecePanel = /Hola|Agendar Cita|Mis Citas|Planes/i.test(bodyText || '');
  console.log('URL final:', url);
  console.log('¿Aterrizó en panel con sesión (sin pasar por /login)?:', url.includes('/dashboard') && parecePanel);

  await page.screenshot({ path: path.join(__dirname, 'screenshots', '10_registro_autologin.png'), fullPage: true });

  await browser.close();

  // Limpieza posterior: no dejar la cuenta de prueba en la BD real
  await pool.query('DELETE FROM refresh_tokens WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = $1)', [TEST_EMAIL]);
  await pool.query('DELETE FROM usuarios WHERE email = $1', [TEST_EMAIL]);
  await pool.query('DELETE FROM registro_temporal WHERE email = $1', [TEST_EMAIL]);
  console.log('Cuenta de prueba eliminada.');
  await pool.end();
})().catch(async (e) => {
  console.error('FALLO:', e);
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE usuario_id IN (SELECT id FROM usuarios WHERE email = $1)', [TEST_EMAIL]);
    await pool.query('DELETE FROM usuarios WHERE email = $1', [TEST_EMAIL]);
    await pool.query('DELETE FROM registro_temporal WHERE email = $1', [TEST_EMAIL]);
  } catch {}
  process.exit(1);
});
