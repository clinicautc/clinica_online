const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.click('button:has-text("Dieta y antropometría")');
  await page.waitForTimeout(500);

  const card = await page.$('text=Aspectos dietéticos');
  const section = await card.evaluateHandle(el => el.closest('div')?.parentElement);
  await page.waitForTimeout(200);
  const box = await page.locator('text=Aspectos dietéticos').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]').first();
  await page.screenshot({ path: __dirname + '/screenshots/captura_dietetico.png', fullPage: false, clip: { x: 0, y: 0, width: 1400, height: 700 } });
  console.log('Screenshot guardado.');
  await browser.close();
})();
