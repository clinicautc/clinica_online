const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Volver') || b.textContent.includes('Imprimir') || b.textContent.includes('Editar'));
    return btns.map(b => {
      const cs = getComputedStyle(b);
      return {
        text: b.textContent.trim(),
        backgroundColor: cs.backgroundColor,
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        boxShadow: cs.boxShadow,
        className: b.className,
        width: b.getBoundingClientRect().width,
        height: b.getBoundingClientRect().height,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
