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

  const result = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('.page .page-content > .section-row'));
    const sr = sections[3];
    const tab = sr.querySelector('.tab-vertical');
    const wrap = sr.querySelector('.table-wrap');
    const table = wrap.querySelector('table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));

    const px = (el) => parseFloat(getComputedStyle(el).height);

    table.style.height = 'auto';
    const theadH = px(thead);
    const naturalRowHeights = rows.map(px);
    const naturalTotal = theadH + naturalRowHeights.reduce((a,b)=>a+b,0);
    const targetHeight = px(tab); // logical, pre-zoom, via computed style
    const extra = Math.max(0, targetHeight - naturalTotal);
    const extraPerRow = extra / rows.length;

    rows.forEach((r, i) => {
      r.style.height = (naturalRowHeights[i] + extraPerRow) + 'px';
    });
    table.style.height = '';

    const finalRowHeightsRendered = rows.map(r => r.getBoundingClientRect().height);
    const finalWrapHeightRendered = wrap.getBoundingClientRect().height;
    const finalTabHeightRendered = tab.getBoundingClientRect().height;

    return { theadH, naturalRowHeights, naturalTotal, targetHeight, extra, extraPerRow, finalRowHeightsRendered, finalWrapHeightRendered, finalTabHeightRendered };
  });
  console.log(JSON.stringify(result, null, 2));

  await page.locator('.page .page-content > .section-row').nth(3).screenshot({ path: __dirname + '/screenshots/diet_jsfix2_test.png' });

  await browser.close();
})();
