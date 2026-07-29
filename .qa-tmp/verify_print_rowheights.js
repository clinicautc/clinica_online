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
  await page.waitForTimeout(1500);

  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.waitForTimeout(300);
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(200);

  const info = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('.page .page-content > .section-row'));
    const sr = sections[3];
    const rows = Array.from(sr.querySelectorAll('tbody tr'));
    return rows.map(r => r.getBoundingClientRect().height);
  });
  console.log('Row heights under print emulation:', info);

  await browser.close();
})();
