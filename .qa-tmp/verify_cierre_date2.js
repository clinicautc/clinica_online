const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.click('button[role="tab"]:has-text("Pacientes")');
  await page.waitForTimeout(1000);

  const fechaInput = page.locator('input[type="date"]').first();
  await fechaInput.scrollIntoViewIfNeeded();
  const target = new Date();
  target.setDate(target.getDate() + 15);
  const iso = target.toISOString().split('T')[0];
  await fechaInput.fill(iso);
  await page.click('button:has-text("Cerrar día")');
  await page.waitForTimeout(1500);

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Contiene "Invalid Date":', text.includes('Invalid Date'));
  const cierreBox = await page.locator('p.text-red-800').first().textContent().catch(() => null);
  console.log('Texto del cierre mostrado:', cierreBox);

  await page.screenshot({ path: __dirname + '/screenshots/cierre_fecha.png', fullPage: false });

  await browser.close();
})();
