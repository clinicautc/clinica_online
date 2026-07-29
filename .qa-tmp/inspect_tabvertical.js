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
    const rows = Array.from(document.querySelectorAll('.section-row')).map(sr => {
      const tab = sr.querySelector('.tab-vertical');
      const wrap = sr.querySelector('.table-wrap');
      if (!tab || !wrap) return null;
      const tabSpan = tab.querySelector('span');
      return {
        label: tabSpan ? tabSpan.textContent : null,
        sectionRowHeight: sr.getBoundingClientRect().height,
        tabScrollHeight: tab.scrollHeight,
        tabClientHeight: tab.clientHeight,
        wrapScrollHeight: wrap.scrollHeight,
        tableHeight: wrap.querySelector('table') ? wrap.querySelector('table').getBoundingClientRect().height : null,
      };
    }).filter(Boolean);
    return rows;
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
