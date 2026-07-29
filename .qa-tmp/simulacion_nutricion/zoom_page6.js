const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const page6 = await page.$('.page6');
  await page6.screenshot({ path: 'screenshots/zoom_page6_full.png' });

  const info = await page.evaluate(() => {
    const page6el = document.querySelector('.page6');
    const r = page6el.getBoundingClientRect();
    return { heightPx: r.height, top: r.top, bottom: r.bottom };
  });
  console.log(JSON.stringify(info));
  await browser.close();
})();
