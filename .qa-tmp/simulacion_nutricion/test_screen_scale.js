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

  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const info = await page.evaluate(() => {
    const pageEl = document.querySelector('.page');
    const cs = getComputedStyle(pageEl);
    return {
      zoom: cs.zoom,
      screenScaleVar: pageEl.style.getPropertyValue('--screen-scale'),
      rectWidth: pageEl.getBoundingClientRect().width,
      innerWidth: window.innerWidth,
      docElClientWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'screenshots/mobile_seguimiento_scaled.png', fullPage: false });
  await browser.close();
})();
