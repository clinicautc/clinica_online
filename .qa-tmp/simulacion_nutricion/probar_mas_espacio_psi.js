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
      const original = el.value;
      let lo = 0, hi = RELLENO.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2);
        el.value = RELLENO.slice(0, mid);
        const overflow = el.scrollHeight > el.clientHeight + 1;
        if (overflow) hi = mid - 1; else lo = mid;
      }
      el.value = original;
      return lo;
    }

    const mmToPx = 279.4 * 96 / 25.4;
    const pageEl = document.querySelector('.page');
    const antes = { sobrante: (mmToPx - pageEl.getBoundingClientRect().height) * 25.4/96, psi: capacidad('psi_q0_col1') };

    // Probamos apretar: márgenes de página, gap bajo header, gap bajo datos-personales,
    // gaps entre las 4 tablas — Y agrandar el tab-vertical de A. Psicológicos para
    // que la tabla pueda usar ese espacio ganado.
    const originalStyles = [];
    function set(el, prop, val) {
      originalStyles.push([el, prop, el.style[prop]]);
      el.style[prop] = val;
    }

    set(pageEl, 'paddingTop', '6mm');
    set(pageEl, 'paddingBottom', '6mm');
    const header = document.querySelector('.page .header');
    set(header, 'marginBottom', '3mm');
    const datosWrapper = document.querySelector('.page .datos-wrapper');
    set(datosWrapper, 'marginBottom', '1.5mm');
    const sectionRows = Array.from(document.querySelectorAll('.page .section-row'));
    sectionRows.forEach(sr => set(sr, 'marginBottom', '1mm'));

    // Agrandamos el tab-vertical (y por lo tanto la tabla) de A. Psicológicos
    const psiTabVertical = document.querySelector('[name="psi_q0_col1"]').closest('.section-row').querySelector('.tab-vertical');
    set(psiTabVertical, 'minHeight', '150px');

    const despues = { sobrante: (mmToPx - pageEl.getBoundingClientRect().height) * 25.4/96, psi: capacidad('psi_q0_col1') };

    // Revertir todo (solo queremos medir, no dejar aplicado hasta confirmar)
    originalStyles.forEach(([el, prop, val]) => { el.style[prop] = val; });

    return { antes, despues };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
