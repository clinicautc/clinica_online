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

  const info = await page.evaluate(() => {
    function labelOverflow(name) {
      const el = document.querySelector(`[name="${name}"]`);
      const td = el.closest('td');
      return {
        text: td.textContent.trim(),
        wraps: td.scrollHeight > td.clientHeight + 1,
        widthPx: Math.round(td.getBoundingClientRect().width),
      };
    }
    const labels = {};
    // Firmas: buscar la celda de la fila "Matrícula" y "Céd. Prof."
    document.querySelectorAll('.td-label').forEach(td => {
      const t = td.textContent.trim();
      if (t.includes('Matrícula') || t.includes('Céd') || t.includes('Indicación')) {
        labels[t] = { wraps: td.scrollHeight > td.clientHeight + 1, widthPx: Math.round(td.getBoundingClientRect().width) };
      }
    });

    function maxChars(name) {
      const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta '.repeat(30);
      const el = document.querySelector(`[name="${name}"]`);
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
      return lo;
    }

    return {
      labels,
      maxChars_interv_ind_col1: maxChars('interv_ind_col1'),
      maxChars_firma_0_col1: maxChars('firma_0_col1'),
      maxChars_firma_4_col1: maxChars('firma_4_col1'),
      maxChars_firma_final_col1: maxChars('firma_final_col1'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'screenshots/check_labels_page6.png', fullPage: true });
  await browser.close();
})();
