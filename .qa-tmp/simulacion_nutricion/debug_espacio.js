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
    const pageEl = document.querySelector('.page');
    const antes = pageEl.getBoundingClientRect().height;

    pageEl.style.paddingTop = '6mm';
    pageEl.style.paddingBottom = '6mm';
    const csDespues = getComputedStyle(pageEl);
    const despues = pageEl.getBoundingClientRect().height;

    const psiTabVertical = document.querySelector('[name="psi_q0_col1"]').closest('.section-row').querySelector('.tab-vertical');
    const alturaTabAntes = psiTabVertical.getBoundingClientRect().height;
    const tableWrapAntes = psiTabVertical.parentElement.querySelector('.table-wrap').getBoundingClientRect().height;
    psiTabVertical.style.minHeight = '150px';
    const alturaTabDespues = psiTabVertical.getBoundingClientRect().height;
    const tableWrapDespues = psiTabVertical.parentElement.querySelector('.table-wrap').getBoundingClientRect().height;

    return {
      pagePaddingComputed: csDespues.paddingTop,
      alturaPageAntes: antes, alturaPageDespues: despues,
      tabVerticalAntes: alturaTabAntes, tabVerticalDespues: alturaTabDespues,
      tableWrapAntes, tableWrapDespues,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
