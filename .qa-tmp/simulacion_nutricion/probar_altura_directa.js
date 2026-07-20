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

    function alturaPagina() { return pageEl.getBoundingClientRect().height; }

    const resultados = { inicial: alturaPagina() };

    // Probamos crecer la fila de A. Psicológicos en pasos, viendo en qué punto
    // el contenedor .page finalmente se pasa de 279.4mm de verdad.
    const filas = document.querySelectorAll('[name^="psi_q"][name$="_col1"]');
    const pasos = [40, 44, 48, 52, 56, 60];
    for (const h of pasos) {
      filas.forEach(el => {
        el.style.height = h + 'px';
        el.closest('td').style.height = h + 'px';
      });
      resultados['altura_' + h + 'px'] = alturaPagina();
    }
    return resultados;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
