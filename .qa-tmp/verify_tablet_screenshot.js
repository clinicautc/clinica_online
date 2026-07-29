const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: __dirname + '/screenshots/tablet_768_nutricion.png', clip: { x: 0, y: 0, width: 768, height: 200 } });
  console.log('ok');
  await browser.close();
})();
