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
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional '.repeat(15);
    const el = document.querySelector('[name="psi_q0_col1"]');
    const original = el.value;

    // Medir cuánto margen horizontal real tiene la página (¿la tabla ocupa
    // exactamente el ancho de página, o hay padding/columna de label que se
    // pueda recortar?)
    const pageEl = document.querySelector('.page');
    const pageCs = getComputedStyle(pageEl);
    const table = el.closest('table');
    const tableR = table.getBoundingClientRect();
    const labelCell = table.querySelector('td.td-label, th');
    const tabVertical = document.querySelector('.tab-vertical');

    function medir(fs, widthPx) {
      const prevFont = el.style.fontSize;
      const prevWidth = el.style.width;
      const prevTdWidth = el.parentElement.style.width;
      el.style.fontSize = fs + 'px';
      if (widthPx) { el.style.width = widthPx + 'px'; el.parentElement.style.width = widthPx + 'px'; }
      let lo = 0, hi = RELLENO.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2);
        el.value = RELLENO.slice(0, mid);
        const overflow = el.scrollHeight > el.clientHeight + 1;
        if (overflow) hi = mid - 1; else lo = mid;
      }
      const resultado = lo;
      el.value = original;
      el.style.fontSize = prevFont;
      el.style.width = prevWidth;
      el.parentElement.style.width = prevTdWidth;
      return resultado;
    }

    return {
      pagePaddingLeft: pageCs.paddingLeft, pagePaddingRight: pageCs.paddingRight,
      pageWidthPx: pageEl.getBoundingClientRect().width,
      tableWidthPx: tableR.width,
      labelColWidthPx: labelCell ? labelCell.getBoundingClientRect().width : null,
      tabVerticalWidthPx: tabVertical ? tabVertical.getBoundingClientRect().width : null,
      cap_10px_anchoActual: medir(10, null),
      cap_8px_anchoMas30: medir(8, 104),
      cap_8px_anchoMas60: medir(8, 134),
      cap_8px_altoMas21_anchoMas30: (() => {
        const td = el.closest('td');
        const prevTdStyle = td.getAttribute('style') || '';
        const prevElStyle = el.getAttribute('style') || '';
        el.style.fontSize = '8px'; el.style.width = '104px'; el.style.height = '55px';
        td.style.width = '104px'; td.style.height = '55px';
        let lo = 0, hi = RELLENO.length;
        while (lo < hi) {
          const mid = Math.ceil((lo + hi + 1) / 2);
          el.value = RELLENO.slice(0, mid);
          const overflow = el.scrollHeight > el.clientHeight + 1;
          if (overflow) hi = mid - 1; else lo = mid;
        }
        const r = lo;
        el.value = original;
        td.setAttribute('style', prevTdStyle);
        el.setAttribute('style', prevElStyle);
        return r;
      })(),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
