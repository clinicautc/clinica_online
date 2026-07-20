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
    const pageEl = document.querySelector('.page');
    const r = pageEl.getBoundingClientRect();
    const mmToPx = 279.4 * 96 / 25.4;
    const psiTable = document.querySelector('[name="psi_q0_col1"]').closest('.section-row');
    const psiR = psiTable.getBoundingClientRect();
    return {
      pageHeightPx: r.height,
      expectedHeightPx: mmToPx,
      sobranteMm: (mmToPx - r.height) * 25.4 / 96,
      psiRowHeightPx: psiR.height,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
