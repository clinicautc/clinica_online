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

  const count = await page.locator('input[placeholder="Hora"]').count();
  console.log('Cantidad de inputs Hora en Recordatorio de 24 horas:', count);
  await browser.close();
})();
