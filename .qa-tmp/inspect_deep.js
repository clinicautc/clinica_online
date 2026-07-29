const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('.page .page-content > .section-row'));
    return sections.map(sr => {
      const label = sr.querySelector('.tab-vertical span')?.textContent;
      const wrap = sr.querySelector('.table-wrap');
      const table = wrap.querySelector('table');
      const tbody = table.querySelector('tbody');
      const thead = table.querySelector('thead');
      const csWrap = getComputedStyle(wrap);
      return {
        label,
        wrapSetHeight: csWrap.height,
        wrapMinHeight: csWrap.minHeight,
        wrapBoxSizing: csWrap.boxSizing,
        theadHeight: thead.getBoundingClientRect().height,
        tbodyHeight: tbody.getBoundingClientRect().height,
        tbodyRowCount: tbody.children.length,
        perRowHeight: tbody.getBoundingClientRect().height / tbody.children.length,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
