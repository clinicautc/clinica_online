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

  const tabsAndFields = [
    { tab: 'p2', fields: ['cual_0_col1'] },
    { tab: 'p3', fields: ['eq_0_col1', 'cn_0_col1', 'int_0_col1'] },
    { tab: 'p4', fields: ['diag_interp_1', 'diag_matriz_1', 'sig_0_col1', 'bioq_0_col1', 'bioq_param_0', 'int_bioq_desc_1'] },
    { tab: 'p5', fields: ['explor_0_col1', 'diag_nutri_txt_1'] },
    { tab: 'p6', fields: ['interv_ind_col1', 'interv_macro_0_col1', 'interv_eq_0_col1', 'edu_cont_1', 'firma_0_col1'] },
  ];
  const out = {};
  for (const { tab, fields } of tabsAndFields) {
    await page.click(`button[value="${tab}"], [role="tab"]:has-text("${tab}")`).catch(async () => {
      await page.getByRole('tab', { name: new RegExp(tab, 'i') }).click().catch(() => {});
    });
    // fallback: click by data-value attr commonly used by shadcn tabs
    await page.evaluate((t) => {
      const trigger = document.querySelector(`[value="${t}"]`) || Array.from(document.querySelectorAll('[role="tab"]'))[0];
    }, tab);
    await page.waitForTimeout(300);
    for (const n of fields) {
      const el = await page.$(`[name="${n}"]`);
      out[n] = el ? await el.getAttribute('maxlength') : 'NOT_FOUND';
    }
  }
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})();
