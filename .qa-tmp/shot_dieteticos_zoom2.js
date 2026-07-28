const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // find the table-wrap ancestor of the A. Dietéticos tab-vertical
  const section = await page.locator('.section-row', { has: page.locator('.tab-vertical', { hasText: 'A. Dietéticos' }) }).first();
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await section.screenshot({ path: __dirname + '/screenshots/dieteticos_section_zoom.png' });

  const info = await section.evaluate(el => {
    const wrap = el.querySelector('.table-wrap');
    const table = wrap.querySelector('table');
    const wrapRect = wrap.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    const lastRow = table.querySelector('tbody tr:last-child');
    const lastRowRect = lastRow.getBoundingClientRect();
    return {
      sectionHeight: el.getBoundingClientRect().height,
      wrapHeight: wrapRect.height,
      tableHeight: tableRect.height,
      lastRowBottom: lastRowRect.bottom,
      wrapBottom: wrapRect.bottom,
      gapBelowLastRow: wrapRect.bottom - lastRowRect.bottom,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
