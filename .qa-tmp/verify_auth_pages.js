const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

require(path.join(__dirname, '..', 'utc-api', 'node_modules', 'dotenv')).config({ path: path.join(__dirname, '..', 'utc-api', '.env') });
const { Pool } = require(path.join(__dirname, '..', 'utc-api', 'node_modules', 'pg'));
const pool = new Pool({
  host: process.env.DB_HOST, port: process.env.DB_PORT, database: process.env.DB_NAME,
  user: process.env.DB_USER, password: process.env.DB_PASSWORD, ssl: { rejectUnauthorized: false },
});
async function getLatestCode(email) {
  const r = await pool.query('SELECT codigo_verificacion FROM password_resets WHERE email = $1 ORDER BY expira_en DESC LIMIT 1', [email]);
  return r.rows[0]?.codigo_verificacion;
}

const SS = path.join(__dirname, 'screenshots', 'auth');
if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true });

const VIEWPORTS = [
  { name: '320',  width: 320,  height: 700 },
  { name: '768',  width: 768,  height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ timezoneId: 'UTC' });
  const page = await ctx.newPage();

  // Login
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SS, `login-${vp.name}.png`) });
  }

  // Register
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SS, `register-${vp.name}.png`) });
  }

  // ForgotPassword — recorrer el flujo real (email -> código real leído de la BD -> password)
  // para verificar el fix del checklist de requisitos en el paso "password".
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/forgot-password', { waitUntil: 'networkidle' });
  await page.fill('input[placeholder="tu@email.com"]', 'carlos.nutri@edu.utc.mx');
  await page.click('button[type="submit"]');
  await page.waitForSelector('input[placeholder="123456"]', { timeout: 20000 });
  console.log('Llegó al paso código.');
  const codigo = await getLatestCode('carlos.nutri@edu.utc.mx');
  console.log('Código leído de la BD:', codigo);
  await page.fill('input[placeholder="123456"]', codigo);
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=Nueva contraseña', { timeout: 20000 }).catch(() => {});
  console.log('Texto tras enviar código:', (await page.evaluate(() => document.body.innerText)).slice(0, 400));
  await pool.end();

  const stepReached = await page.evaluate(() => document.body.innerText.includes('Nueva contraseña'));
  console.log('¿Llegó al paso "password"?', stepReached);

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SS, `forgotpw-password-${vp.name}.png`) });
    const info = await page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('li')).filter(li => /mayúscula|minúscula|carácter especial|número|8 caracteres/i.test(li.textContent || ''));
      return { checklistItemCount: items.length, checklistVisible: items.some(li => li.getBoundingClientRect().width > 0) };
    });
    console.log(`${vp.name}px:`, JSON.stringify(info));
  }

  await browser.close();
  console.log(`Screenshots en ${SS}`);
})();
