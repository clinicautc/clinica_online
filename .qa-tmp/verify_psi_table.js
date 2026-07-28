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
    const cells = Array.from(document.querySelectorAll('.psi-cell-text'));
    return cells.map(c => {
      const hasVScroll = c.scrollHeight > c.clientHeight + 1;
      const hasHScroll = c.scrollWidth > c.clientWidth + 1;
      return { text: c.textContent.slice(0, 40), hasVScroll, hasHScroll, scrollHeight: c.scrollHeight, clientHeight: c.clientHeight, scrollWidth: c.scrollWidth, clientWidth: c.clientWidth };
    });
  });
  console.log(JSON.stringify(info, null, 2));

  const target = await page.locator('.psi-cell-text', { hasText: 'Sintió ansiedad inicial' }).first();
  await target.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await target.screenshot({ path: __dirname + '/screenshots/psi_cell_target.png' });

  await browser.close();
})();
