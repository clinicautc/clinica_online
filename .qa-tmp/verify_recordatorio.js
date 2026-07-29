const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1800 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const el = await page.locator('text=Recordatorio de 24 horas').first().locator('xpath=ancestor::section[1]');
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await el.screenshot({ path: __dirname + '/screenshots/recordatorio_after.png' });
  console.log('Screenshot guardado.');
  await browser.close();
})();
