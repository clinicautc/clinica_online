const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  // cita 76 = Consulta #5 según el endpoint expandido
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/76/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', '12_ver_expediente_col5.png') });
  console.log('ok');
  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
