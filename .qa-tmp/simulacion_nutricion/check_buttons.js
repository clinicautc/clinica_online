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
  // Buscar los botones Volver/Imprimir/Editar
  const buttons = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button')).slice(0, 10).map(b => {
      const cs = getComputedStyle(b);
      const r = b.getBoundingClientRect();
      return { text: b.textContent.trim(), bg: cs.backgroundColor, color: cs.color, x: r.x, y: r.y, w: r.width, h: r.height };
    });
  });
  console.log(JSON.stringify(buttons, null, 2));
  await browser.close();
})();
