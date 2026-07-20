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
  for (const delay of [0, 300, 800, 1500, 3000]) {
    await page.waitForTimeout(delay === 0 ? 0 : 300);
    const w = await page.evaluate(() => window.innerWidth);
    console.log('innerWidth after cumulative delay ~', delay, ':', w);
  }
  await browser.close();
})();
