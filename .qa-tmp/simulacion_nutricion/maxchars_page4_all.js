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
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta '.repeat(30);
    function maxChars(name) {
      const el = document.querySelector(`[name="${name}"]`);
      if (!el) return 'NOT_FOUND';
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
      diag_matriz_1: maxChars('diag_matriz_1'),
      diag_interp_1: maxChars('diag_interp_1'),
      sig_0_col1: maxChars('sig_0_col1'),
      bioq_0_col1: maxChars('bioq_0_col1'),
      bioq_param_0: maxChars('bioq_param_0'),
      int_bioq_desc_1: maxChars('int_bioq_desc_1'),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: 'screenshots/page4_full_after_fix.png', clip: await page.evaluate(() => { const r = document.querySelector('.page4').getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height}; }) });
  await browser.close();
})();
