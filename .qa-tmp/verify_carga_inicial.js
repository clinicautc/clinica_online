const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("Pacientes")').first().click().catch(()=>{});
  await page.waitForTimeout(3000); // esperar bastante mas esta vez
  const contador = page.locator('span.tabular-nums').first();
  console.log('Valor tras esperar 3s completos:', await contador.textContent());
  await browser.close();
})();
