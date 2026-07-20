const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const screenInfo = await page.evaluate(() => {
    const el = document.querySelector('.p1-paper');
    return { zoom: getComputedStyle(el).zoom, screenScale: el.style.getPropertyValue('--screen-scale') };
  });
  console.log('Desktop screen:', JSON.stringify(screenInfo));

  await page.emulateMedia({ media: 'print' });
  const printInfo = await page.evaluate(() => {
    const el = document.querySelector('.p1-paper');
    return { zoom: getComputedStyle(el).zoom };
  });
  console.log('Print media:', JSON.stringify(printInfo));
  await browser.close();
})();
