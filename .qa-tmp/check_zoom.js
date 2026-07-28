const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const papers = Array.from(document.querySelectorAll('.p1-paper'));
    return papers.map((p, i) => {
      const cs = getComputedStyle(p);
      return {
        idx: i,
        zoomStyleAttr: p.style.zoom,
        screenScaleVar: p.style.getPropertyValue('--screen-scale'),
        computedZoom: cs.zoom,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('viewport width used for this check:', 1400);
  await browser.close();
})();
