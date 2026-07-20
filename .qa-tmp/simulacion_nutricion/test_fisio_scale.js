const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.goto('http://localhost:5173/forms/fisioterapia/1/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const el = document.querySelector('.page');
    if (!el) return { found: false };
    const cs = getComputedStyle(el);
    return { found: true, zoom: cs.zoom, screenScale: el.style.getPropertyValue('--screen-scale'), bodyScrollWidth: document.body.scrollWidth, innerWidth: window.innerWidth };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'screenshots/mobile_fisio_scaled.png', fullPage: false });
  await browser.close();
})();
