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
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta '.repeat(30);
    function capacidad(nombre) {
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
      return lo;
    }
    const mmToPx = 279.4 * 96 / 25.4;
    const paginas = {};
    for (const c of ['page','page2','page3','page4','page5','page6']) {
      const el = document.querySelector('.' + c);
      const r = el.getBoundingClientRect();
      paginas[c] = ((mmToPx - r.height) * 25.4 / 96).toFixed(2) + 'mm';
    }
    return {
      sobrantePorPagina: paginas,
      psi_q0: capacidad('psi_q0_col1'),
      sint_0: capacidad('sint_0_col1'),
      ejer_0: capacidad('ejer_0_col1'),
      diet_0: capacidad('diet_0_col1'),
      sig_0: capacidad('sig_0_col1'),
      explor_0: capacidad('explor_0_col1'),
      firma_0: capacidad('firma_0_col1'),
      interv_ind: capacidad('interv_ind_col1'),
      interv_macro_0: capacidad('interv_macro_0_col1'),
      interv_eq_0: capacidad('interv_eq_0_col1'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
