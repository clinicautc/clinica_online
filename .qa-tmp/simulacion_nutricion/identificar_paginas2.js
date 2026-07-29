const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const mmToPx = 279.4 * 96 / 25.4;
    const clases = ['page', 'page2', 'page3', 'page4', 'page5', 'page6'];
    const out = {};
    for (const c of clases) {
      const el = document.querySelector('.' + c);
      if (!el) { out[c] = 'NO_ENCONTRADA'; continue; }
      const r = el.getBoundingClientRect();
      out[c] = { alturaPx: r.height, sobranteMm: ((mmToPx - r.height) * 25.4 / 96).toFixed(2) };
    }
    return out;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
