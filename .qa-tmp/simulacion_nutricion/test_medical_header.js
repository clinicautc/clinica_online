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
  await page.goto('http://localhost:5173/medical-history-viewer/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'screenshots/medical_header_mobile.png', fullPage: false });
  await browser.close();
})();
