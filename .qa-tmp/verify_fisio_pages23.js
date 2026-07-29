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
  await page.goto('http://localhost:5173/forms/fisioterapia/1/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const pg2 = await page.$('.page-p2');
  await pg2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await pg2.screenshot({ path: __dirname + '/screenshots/fisio_mobile_page2.png' });

  const pg3 = await page.$('.page-p3');
  await pg3.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await pg3.screenshot({ path: __dirname + '/screenshots/fisio_mobile_page3.png' });

  console.log('ok');
  await browser.close();
})();
