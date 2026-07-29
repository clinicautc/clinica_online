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
  // Formulario de captura de Seguimiento Nutricional para cita 78
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const names = ['psi_q0_col1', 'sint_0_col1', 'ejer_0_col1', 'diet_0_col1', 'cual_0_col1',
      'eq_0_col1', 'cn_0_col1', 'int_0_col1', 'diag_interp_1', 'sig_0_col1', 'bioq_0_col1',
      'bioq_param_0', 'int_bioq_desc_1', 'explor_0_col1', 'diag_nutri_txt_1', 'interv_ind_col1',
      'interv_macro_0_col1', 'interv_eq_0_col1', 'edu_cont_1', 'firma_0_col1', 'diag_matriz_1'];
    const out = {};
    for (const n of names) {
      const el = document.querySelector(`[name="${n}"]`);
      out[n] = el ? el.getAttribute('maxlength') : 'ELEMENT_NOT_FOUND';
    }
    return out;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
