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

  const info = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.tabla-t4 textarea')).map(t => ({
      overflow: getComputedStyle(t).overflow,
      height: t.clientHeight,
      scrollHeight: t.scrollHeight,
    }));
  });
  console.log(JSON.stringify(info, null, 2));

  const tableEl = await page.locator('.tabla-t4').first();
  await tableEl.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await tableEl.screenshot({ path: __dirname + '/screenshots/interp_bioq_final.png' });

  await browser.close();
})();
