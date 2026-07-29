const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const routes = [
    ['nutricion_hc', 'http://localhost:5173/forms/nutricion/72/documento'],
    ['seguimiento_nutricional', 'http://localhost:5173/forms/seguimiento-nutricional/73/documento'],
    ['fisioterapia_hc', 'http://localhost:5173/forms/fisioterapia/1/documento'],
    ['seguimiento_fisio', 'http://localhost:5173/forms/seguimiento/1/documento'],
  ];

  for (const [name, url] of routes) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: __dirname + `/screenshots/mobile_buttons_${name}.png` });
    console.log(name, 'ok');
  }
  await browser.close();
})();
