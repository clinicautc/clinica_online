const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1500);

  await page.goto('http://localhost:5173/medical-history-viewer/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', '09_ruta_arreglada.png'), fullPage: true });
  console.log('ok');
  await browser.close();
})().catch((e) => { console.error('FALLO:', e); process.exit(1); });
