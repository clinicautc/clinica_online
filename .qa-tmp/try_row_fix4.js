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

    // reset table to natural height to measure natural row heights
    table.style.height = 'auto';
    const theadH = thead.getBoundingClientRect().height;
    const naturalRowHeights = rows.map(r => r.getBoundingClientRect().height);
    const naturalTotal = theadH + naturalRowHeights.reduce((a,b)=>a+b,0);

    const targetHeight = tab.getBoundingClientRect().height; // natural, since tab isn't stretched now (table reset broke stretch)
    // Actually better: use tab.scrollHeight (content-based, doesn't depend on stretch)
    const targetFromScroll = tab.scrollHeight;

    const extra = Math.max(0, targetFromScroll - naturalTotal);
    const extraPerRow = extra / rows.length;

    rows.forEach((r, i) => {
      r.style.height = (naturalRowHeights[i] + extraPerRow) + 'px';
    });
    table.style.height = ''; // let it be natural sum now (auto, since explicit row heights drive it)

    const finalRowHeights = rows.map(r => r.getBoundingClientRect().height);
    const finalWrapHeight = wrap.getBoundingClientRect().height;
    const finalTabHeight = tab.getBoundingClientRect().height;

    return { theadH, naturalRowHeights, naturalTotal, targetFromScroll, extra, extraPerRow, finalRowHeights, finalWrapHeight, finalTabHeight };
  });
  console.log(JSON.stringify(result, null, 2));

  await page.locator('.page .page-content > .section-row').nth(3).screenshot({ path: __dirname + '/screenshots/diet_jsfix_test.png' });

  await browser.close();
})();
