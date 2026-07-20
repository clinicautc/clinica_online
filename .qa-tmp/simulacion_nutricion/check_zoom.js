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
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  const info = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const csHtml = getComputedStyle(html);
    const csBody = getComputedStyle(body);
    return {
      htmlZoom: csHtml.zoom, bodyZoom: csBody.zoom,
      htmlTransform: csHtml.transform, bodyTransform: csBody.transform,
      htmlWidth: html.getBoundingClientRect().width,
      bodyWidth: body.getBoundingClientRect().width,
      visualViewportWidth: window.visualViewport ? window.visualViewport.width : null,
      devicePixelRatio: window.devicePixelRatio,
      metaViewport: document.querySelector('meta[name="viewport"]')?.getAttribute('content'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
