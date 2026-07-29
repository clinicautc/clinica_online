const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1600 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Exploración")');
  await page.waitForTimeout(500);

  const section = await page.locator('text=Recordatorio de 24 horas').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]').first();
  await section.scrollIntoViewIfNeeded();
  await page.screenshot({ path: __dirname + '/screenshots/captura_recordatorio.png', clip: { x: 0, y: 0, width: 1400, height: 900 } });
  console.log('Screenshot guardado.');
  await browser.close();
})();
