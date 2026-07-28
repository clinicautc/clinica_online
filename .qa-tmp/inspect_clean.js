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
    const sr = sections[3]; // A. Dietéticos
    const tab = sr.querySelector('.tab-vertical');
    const wrap = sr.querySelector('.table-wrap');
    const table = wrap.querySelector('table');
    const srRect = sr.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const tableRect = table.getBoundingClientRect();
    return {
      label: tab.querySelector('span').textContent,
      srRect: { top: srRect.top, bottom: srRect.bottom, height: srRect.height },
      tabRect: { top: tabRect.top, bottom: tabRect.bottom, height: tabRect.height },
      wrapRect: { top: wrapRect.top, bottom: wrapRect.bottom, height: wrapRect.height },
      tableRect: { top: tableRect.top, bottom: tableRect.bottom, height: tableRect.height },
      wrapComputed: { height: getComputedStyle(wrap).height, overflow: getComputedStyle(wrap).overflow, display: getComputedStyle(wrap).display, alignSelf: getComputedStyle(wrap).alignSelf, flexGrow: getComputedStyle(wrap).flexGrow, flexBasis: getComputedStyle(wrap).flexBasis },
      srComputed: { display: getComputedStyle(sr).display, alignItems: getComputedStyle(sr).alignItems, height: getComputedStyle(sr).height },
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
