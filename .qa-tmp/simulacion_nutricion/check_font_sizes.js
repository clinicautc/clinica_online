const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const info = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('.p1-paper input:not([type="checkbox"]), .p1-paper textarea'));
    const sizes = new Set(els.map(e => getComputedStyle(e).fontSize));
    return { totalEls: els.length, distinctSizes: Array.from(sizes) };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'screenshots/historial72_fontsize_check.png', fullPage: true });
  await browser.close();
})();
