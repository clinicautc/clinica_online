const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', m => console.log('CONSOLE:', m.text()));
  page.on('pageerror', e => console.log('PAGEERROR:', e.message));
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  console.log('URL after goto:', page.url());
  const emailExists = await page.$('#email');
  console.log('email selector exists:', !!emailExists);
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  console.log('URL after submit:', page.url());
  await browser.close();
})();
