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
  await page.goto('http://localhost:5173/forms/seguimiento/13/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: 'screenshots/mobile_hojaevolutiva.png', fullPage: false });
  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => /Volver|Imprimir|Editar/.test(b.textContent));
    return btns.map(b => ({ text: b.textContent.trim(), padding: getComputedStyle(b).padding, bg: getComputedStyle(b).backgroundColor }));
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
