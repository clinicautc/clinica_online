const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto('http://localhost:5173/administrar-personal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const row = page.locator('tr', { hasText: 'Maria Fisio' }).first();
  await row.scrollIntoViewIfNeeded();
  await row.locator('button:has-text("Horario")').click({ force: true });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: __dirname + '/screenshots/ampm_practicas.png' });
  await browser.close();
})();
