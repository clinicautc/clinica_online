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
    const pageEl = document.querySelector('.page');
    function alturaPagina() { return pageEl.getBoundingClientRect().height; }

    const filas = document.querySelectorAll('[name^="psi_q"][name$="_col1"]');
    let lo = 36, hi = 60, mejorSeguro = 36;
    while (lo <= hi) {
      const h = Math.floor((lo + hi) / 2);
      filas.forEach(el => { el.style.height = h + 'px'; el.closest('td').style.height = h + 'px'; });
      if (alturaPagina() <= 1056.5) { mejorSeguro = h; lo = h + 1; } else { hi = h - 1; }
    }

    // Aplicar la altura segura encontrada y medir capacidad real
    filas.forEach(el => { el.style.height = mejorSeguro + 'px'; el.closest('td').style.height = mejorSeguro + 'px'; });
    const el = document.querySelector('[name="psi_q0_col1"]');
    const original = el.value;
    let l = 0, h2 = RELLENO.length;
    while (l < h2) {
      const mid = Math.ceil((l + h2 + 1) / 2);
      el.value = RELLENO.slice(0, mid);
      const overflow = el.scrollHeight > el.clientHeight + 1;
      if (overflow) h2 = mid - 1; else l = mid;
    }
    el.value = original;

    return { alturaSeguraPx: mejorSeguro, alturaFinalPagina: alturaPagina(), capacidadResultante: l };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
