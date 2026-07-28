const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const tableEl = await page.locator('td.td-label', { hasText: 'Medicamentos' }).first();
  await tableEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await tableEl.boundingBox();
  console.log('box', box);

  // screenshot the whole A. Dietéticos table (parent table-wrap)
  const wrap = await tableEl.locator('xpath=ancestor::div[contains(@class,"table-wrap")]').first();
  await wrap.screenshot({ path: __dirname + '/screenshots/dieteticos_table.png' });

  const cs = await tableEl.evaluate(el => {
    const s = getComputedStyle(el);
    return { height: el.clientHeight, lineHeight: s.lineHeight, fontSize: s.fontSize, padding: s.padding, verticalAlign: s.verticalAlign };
  });
  console.log(cs);

  await browser.close();
})();
