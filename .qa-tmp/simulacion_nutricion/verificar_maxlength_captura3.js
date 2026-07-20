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
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const tabLabels = ['Dieta', 'Antropometría', 'Diagnóstico', 'Exploración', 'Intervención'];
  const fieldsByTab = {
    'Dieta': ['cual_0_col1'],
    'Antropometría': ['eq_0_col1', 'cn_0_col1', 'int_0_col1'],
    'Diagnóstico': ['diag_interp_1', 'diag_matriz_1', 'sig_0_col1', 'bioq_0_col1', 'bioq_param_0', 'int_bioq_desc_1'],
    'Exploración': ['explor_0_col1', 'diag_nutri_txt_1'],
    'Intervención': ['interv_ind_col1', 'interv_macro_0_col1', 'interv_eq_0_col1', 'edu_cont_1', 'firma_0_col1'],
  };
  const out = {};
  for (const label of tabLabels) {
    await page.getByRole('tab', { name: label }).click({ timeout: 5000 });
    await page.waitForTimeout(300);
    for (const n of fieldsByTab[label]) {
      const el = await page.$(`[name="${n}"]`);
      out[n] = el ? await el.getAttribute('maxlength') : 'NOT_FOUND';
    }
  }
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
