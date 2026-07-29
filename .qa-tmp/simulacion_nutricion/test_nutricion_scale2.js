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

  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000); // esperar a que desaparezca el toast
  await page.screenshot({ path: 'screenshots/mobile_nutricion_scaled2.png', fullPage: false });
  await browser.close();
})();
