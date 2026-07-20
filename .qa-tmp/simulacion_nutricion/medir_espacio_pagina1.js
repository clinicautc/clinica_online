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
    const pxToMm = px => (px * 25.4 / 96).toFixed(1);
    const pageEl = document.querySelector('.page');
    const cs = getComputedStyle(pageEl);
    const header = document.querySelector('.page .header');
    const datosWrapper = document.querySelector('.page .datos-wrapper');
    const sectionRows = Array.from(document.querySelectorAll('.page .section-row'));
    const footer = document.querySelector('.page .footer');

    const safe = (el, fn) => el ? fn(el) : 'NO_ENCONTRADO';

    return {
      paddingTop_mm: pxToMm(parseFloat(cs.paddingTop)),
      paddingBottom_mm: pxToMm(parseFloat(cs.paddingBottom)),
      headerHeight_mm: safe(header, e => pxToMm(e.getBoundingClientRect().height)),
      headerMarginBottom_mm: safe(header, e => pxToMm(parseFloat(getComputedStyle(e).marginBottom))),
      datosWrapperHeight_mm: safe(datosWrapper, e => pxToMm(e.getBoundingClientRect().height)),
      datosWrapperMarginBottom_mm: safe(datosWrapper, e => pxToMm(parseFloat(getComputedStyle(e).marginBottom))),
      seccionesMarginBottom_mm_cadaUna: sectionRows.length ? pxToMm(parseFloat(getComputedStyle(sectionRows[0]).marginBottom)) : 'NO_ENCONTRADO',
      cantidadSecciones: sectionRows.length,
      footerHeight_mm: safe(footer, e => pxToMm(e.getBoundingClientRect().height)),
      logoFontSize_px: safe(document.querySelector('.logo h1'), e => getComputedStyle(e).fontSize),
      pillTitleFontSize_px: safe(document.querySelector('.pill-title'), e => getComputedStyle(e).fontSize),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
