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
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path: 'screenshots/mobile_dashboard_top.png', fullPage: false });

  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.screenshot({ path: 'screenshots/mobile_nutricion_doc_top.png', fullPage: false });

  const info = await page.evaluate(() => {
    const body = document.body;
    return {
      bodyScrollWidth: body.scrollWidth,
      windowInnerWidth: window.innerWidth,
      docWidthOverflow: body.scrollWidth > window.innerWidth,
    };
  });
  console.log(JSON.stringify(info));
  await browser.close();
})();
