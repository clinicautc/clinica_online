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
    const originalFont = el.style.fontSize;
    const resultados = {};

    for (const fs of [10, 9, 8, 7]) {
      el.style.fontSize = fs + 'px';
      let lo = 0, hi = RELLENO.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2);
        el.value = RELLENO.slice(0, mid);
        const overflow = el.scrollHeight > el.clientHeight + 1;
        if (overflow) hi = mid - 1; else lo = mid;
      }
      resultados[fs] = lo;
    }
    el.value = original;
    el.style.fontSize = originalFont;

    // Ahora también con el alto de fila +50% (simulando agrandar la celda), a 8px
    const row = el.closest('tr');
    const originalRowHeight = row.style.height;
    el.style.fontSize = '8px';
    const tdWrap = el.parentElement; // <td>
    const originalTdStyle = tdWrap.getAttribute('style') || '';
    // Forzamos una altura mayor directamente en el td y el textarea
    tdWrap.style.height = '55px';
    el.style.height = '55px';
    let lo = 0, hi = RELLENO.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi + 1) / 2);
      el.value = RELLENO.slice(0, mid);
      const overflow = el.scrollHeight > el.clientHeight + 1;
      if (overflow) hi = mid - 1; else lo = mid;
    }
    resultados['8px_alto55px'] = lo;
    el.value = original;
    el.style.fontSize = originalFont;
    tdWrap.setAttribute('style', originalTdStyle);
    el.style.height = '';

    return resultados;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
