const { chromium } = require('playwright');
const path = require('path');

const SHOT_DIR = path.join(__dirname, 'screenshots');
require('fs').mkdirSync(SHOT_DIR, { recursive: true });

async function shot(page, name) {
  await page.screenshot({ path: path.join(SHOT_DIR, name), fullPage: true });
  console.log('screenshot:', name);
}

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  console.log('Login como admin de nutrición...');
  await login(page, 'docente.nutricion@edu.utc.mx', 'admin123');
  await page.waitForTimeout(1000);

  console.log('Navegando al expediente del paciente (id 7)...');
  await page.goto('http://localhost:5173/medical-history-viewer/7');
  await page.waitForTimeout(2500);
  await shot(page, '01_expediente_lista.png');

  console.log('Abriendo Historia Clínica Nutricional (cita 72)...');
  await page.goto('http://localhost:5173/forms/nutricion/72/documento');
  await page.waitForTimeout(2000);
  await shot(page, '02_historia_clinica_p1.png');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.35));
  await page.waitForTimeout(300);
  await shot(page, '03_historia_clinica_p2.png');

  console.log('Abriendo Seguimiento Nutricional (documento con 6 columnas, cita 78)...');
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento');
  await page.waitForTimeout(2500);
  await shot(page, '04_seguimiento_top.png');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.4));
  await page.waitForTimeout(300);
  await shot(page, '05_seguimiento_mid.png');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.75));
  await page.waitForTimeout(300);
  await shot(page, '06_seguimiento_bottom.png');

  console.log('Revisando dashboard del paciente (cita 8 programada para mañana)...');
  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await login(page, 'enriquejesusresendiz@hotmail.com', 'Paciente1*');
  await page.waitForTimeout(1500);
  await shot(page, '07_dashboard_paciente.png');

  await browser.close();
  console.log('Listo. Screenshots en', SHOT_DIR);
})().catch((e) => { console.error('FALLO:', e); process.exit(1); });
