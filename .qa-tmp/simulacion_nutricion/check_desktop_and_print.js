const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const screenInfo = await page.evaluate(() => {
    const pageEl = document.querySelector('.page');
    return { zoom: getComputedStyle(pageEl).zoom, screenScale: pageEl.style.getPropertyValue('--screen-scale') };
  });
  console.log('Desktop (1400px) screen media:', JSON.stringify(screenInfo));

  await page.emulateMedia({ media: 'print' });
  const printInfo = await page.evaluate(() => {
    const pageEl = document.querySelector('.page');
    return { zoom: getComputedStyle(pageEl).zoom, printScale: pageEl.style.getPropertyValue('--print-scale'), width: getComputedStyle(pageEl).width };
  });
  console.log('Print media (before beforeprint fires):', JSON.stringify(printInfo));

  await browser.close();
})();
