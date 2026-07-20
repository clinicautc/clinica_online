const { chromium } = require('playwright');
const fs = require('fs');
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
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta '.repeat(30);
    function medir(nombre) {
      const el = document.querySelector(`[name="${nombre}"]`);
      if (!el) return null;
      const original = el.value;
      const isTextarea = el.tagName === 'TEXTAREA';
      let lo = 0, hi = RELLENO.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2);
        el.value = RELLENO.slice(0, mid);
        const overflow = isTextarea ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;
        if (overflow) hi = mid - 1; else lo = mid;
      }
      el.value = original;
      return { max: lo, fontSize: getComputedStyle(el).fontSize };
    }

    const pageEl = document.querySelector('.page');
    const mmToPx = 279.4 * 96 / 25.4;
    const pageHeightPx = pageEl.getBoundingClientRect().height;

    const labelCell = document.querySelector('[name="psi_q4_col1"]').closest('table').querySelectorAll('.td-label')[4];
    const labelOverflow = labelCell.scrollHeight > labelCell.clientHeight + 1;

    return {
      pageHeightPx, expectedHeightPx: mmToPx, sobranteMm: ((mmToPx - pageHeightPx) * 25.4 / 96).toFixed(2),
      psi_q0: medir('psi_q0_col1'),
      sint_0: medir('sint_0_col1'),
      ejer_0: medir('ejer_0_col1'),
      diet_0: medir('diet_0_col1'),
      freq_0: medir('freq_0_col1'),
      cual_0: medir('cual_0_col1'),
      eq_0: medir('eq_0_col1'),
      cn_0: medir('cn_0_col1'),
      sig_0: medir('sig_0_col1'),
      bioq_0: medir('bioq_0_col1'),
      explor_0: medir('explor_0_col1'),
      interv_ind: medir('interv_ind_col1'),
      firma_0: medir('firma_0_col1'),
      labelPsiQ4_textoCompleto_sinCorte: !labelOverflow,
      labelPsiQ4_texto: labelCell.textContent.trim(),
    };
  });
  fs.writeFileSync(__dirname + '/verificacion_fix.json', JSON.stringify(info, null, 2));
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
