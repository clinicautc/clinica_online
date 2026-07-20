const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'e.resendiz.r688@edu.utc.mx');
  await page.fill('#password', 'Practicante1*');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  // cita 78 (columna 6) — practicante asignado, pero ya completada; probamos abrir de todos modos
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'captura_freq.png'), fullPage: true });
  console.log('ok', page.url());
  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
