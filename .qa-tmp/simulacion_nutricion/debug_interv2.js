const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 3 });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const el1 = page.locator('[name="interv_ind_col1"]');
  await el1.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await page.locator('text=Indicación de').first().boundingBox();
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'debug_interv_row.png'), clip: { x: Math.max(0,box.x-20), y: Math.max(0,box.y-10), width: 1300, height: 140 } });
  console.log('ok');
  await browser.close();
})();
