const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const td = await page.locator('td.td-label', { hasText: 'Medicamentos' }).first();
  await td.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const tr = await td.locator('xpath=ancestor::tr').first();
  await tr.screenshot({ path: __dirname + '/screenshots/dieteticos_row_zoom.png' });

  const info = await td.evaluate(el => {
    const tr = el.closest('tr');
    const trRect = tr.getBoundingClientRect();
    const tdRect = el.getBoundingClientRect();
    const span = el; // text node wrapper is just td itself here
    return {
      trHeight: trRect.height,
      tdHeight: tdRect.height,
      tdScrollHeight: el.scrollHeight,
      html: el.outerHTML,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
