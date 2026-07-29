const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(300);

  const styles = await page.evaluate(() => Array.from(document.querySelectorAll('.p1-paper')).map(p => {
    const cs = getComputedStyle(p);
    return { position: cs.position, left: cs.left, transform: cs.transform, marginLeft: cs.marginLeft, marginRight: cs.marginRight, width: cs.width };
  }));
  console.log(JSON.stringify(styles, null, 2));

  await browser.close();
})();
