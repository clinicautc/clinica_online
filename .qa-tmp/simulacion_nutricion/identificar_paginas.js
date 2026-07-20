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

  const campos = ['freq_0_col1','cual_0_col1','eq_0_col1','sig_0_col1','bioq_0_col1','explor_0_col1','firma_0_col1','interv_ind_col1'];
  const info = await page.evaluate((campos) => {
    const mmToPx = 279.4 * 96 / 25.4;
    const out = {};
    for (const nombre of campos) {
      const el = document.querySelector(`[name="${nombre}"]`);
      const pageDiv = el.closest('[class^="page"]');
      const pageClass = pageDiv ? pageDiv.className.split(' ')[0] : null;
      const r = pageDiv.getBoundingClientRect();
      out[nombre] = { pageClass, pageHeightPx: r.height, sobranteMm: ((mmToPx - r.height) * 25.4/96).toFixed(2) };
    }
    return out;
  }, campos);
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
