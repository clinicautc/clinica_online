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
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button')).filter(b => /Volver|Imprimir|Editar/.test(b.textContent || ''));
    return btns.map(b => {
      const r = b.getBoundingClientRect();
      const container = b.closest('.fixed');
      const cRect = container ? container.getBoundingClientRect() : null;
      return {
        text: b.textContent.trim(),
        rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        containerRect: cRect ? { x: cRect.x, y: cRect.y, width: cRect.width, height: cRect.height } : null,
        containerClass: container ? container.className : null,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('window size', await page.evaluate(() => ({ innerWidth: window.innerWidth, innerHeight: window.innerHeight, scrollWidth: document.documentElement.scrollWidth })));
  await browser.close();
})();
