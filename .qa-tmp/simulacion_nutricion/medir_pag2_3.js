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
    const pxToMm = px => +(px * 25.4 / 96).toFixed(2);
    function medirTabla(nombreCampo) {
      const el = document.querySelector(`[name="${nombreCampo}"]`);
      if (!el) return 'NO_ENCONTRADO';
      const table = el.closest('table');
      const filas = table.querySelectorAll('tbody tr, tr');
      const primerasFilaTr = table.querySelector('tr');
      return {
        filaAlturaPx: primerasFilaTr.getBoundingClientRect().height,
        filaAlturaMm: pxToMm(primerasFilaTr.getBoundingClientRect().height),
        totalFilas: filas.length,
        tablaAlturaMm: pxToMm(table.getBoundingClientRect().height),
      };
    }

    const page2 = document.querySelector('.page2');
    const page3 = document.querySelector('.page3');
    const mmToPx = 279.4 * 96 / 25.4;

    return {
      page2_alturaTotalMm: pxToMm(page2.getBoundingClientRect().height),
      page2_sobranteMm: +((mmToPx - page2.getBoundingClientRect().height) * 25.4/96).toFixed(2),
      page2_paddingMm: pxToMm(parseFloat(getComputedStyle(page2).padding)),
      freq_tabla: medirTabla('freq_0_col1'),
      cual_tabla: medirTabla('cual_0_col1'),

      page3_alturaTotalMm: pxToMm(page3.getBoundingClientRect().height),
      page3_sobranteMm: +((mmToPx - page3.getBoundingClientRect().height) * 25.4/96).toFixed(2),
      page3_paddingMm: pxToMm(parseFloat(getComputedStyle(page3).padding)),
      eq_tabla: medirTabla('eq_0_col1'),
      antro_tabla: medirTabla('antro_0_col1'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
