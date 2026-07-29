const { chromium } = require('playwright');

const VIEWPORTS = [
  { name: '640_min-breakpoint', width: 640, height: 900 },
  { name: '768_ipad-portrait', width: 768, height: 1024 },
  { name: '820_ipad-air', width: 820, height: 1180 },
  { name: '1024_ipad-landscape', width: 1024, height: 768 },
];

const ROUTES = [
  ['nutricion_hc', 'http://localhost:5173/forms/nutricion/72/documento', '.p1-outer'],
  ['seguimiento_nutricional', 'http://localhost:5173/forms/seguimiento-nutricional/73/documento', '.hoja-evolutiva-wrapper'],
  ['fisioterapia_hc', 'http://localhost:5173/forms/fisioterapia/1/documento', '.hc-body'],
  ['seguimiento_fisio', 'http://localhost:5173/forms/seguimiento/1/documento', '.hoja-evolutiva-wrapper'],
];

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const vp of VIEWPORTS) {
    console.log(`\n=== VIEWPORT ${vp.name} (${vp.width}x${vp.height}) ===`);
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: vp.width < 1000, hasTouch: vp.width < 1000 });
    const page = await ctx.newPage();
    await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'master@edu.utc.mx');
    await page.fill('input[type="password"]', 'master123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);

    for (const [name, url, wrapperSel] of ROUTES) {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const innerWidth = await page.evaluate(() => window.innerWidth);
      const wrapperZoom = await page.evaluate((sel) => {
        const el = document.querySelector(sel);
        return el ? getComputedStyle(el).zoom : null;
      }, wrapperSel);
      const btns = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .filter(b => /Volver|Imprimir|Editar/.test(b.textContent || ''))
          .map(b => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), right: r.right, left: r.x }; });
      });
      const maxBtnRight = btns.length ? Math.max(...btns.map(b => b.right)) : null;
      const overflow = maxBtnRight !== null && maxBtnRight > innerWidth + 1;

      console.log(`${name}: innerWidth=${innerWidth} wrapperZoom=${wrapperZoom} maxBtnRight=${maxBtnRight?.toFixed(1)} ${overflow ? '*** BOTONES DESBORDAN ***' : 'ok'}`);
    }
    await ctx.close();
  }

  await browser.close();
})();
