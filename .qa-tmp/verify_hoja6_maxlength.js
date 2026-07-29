const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const check = async (selector, label) => {
    const vals = await page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).map(el => el.maxLength), selector);
    console.log(label, 'count=', vals.length, 'maxLength=', [...new Set(vals)]);
  };
  await check('textarea[name^="interv_ind_col"]', 'interv_ind');
  await check('input[name^="interv_macro_"]', 'interv_macro');
  await check('input[name^="interv_eq_"]', 'interv_eq');
  await check('textarea[name^="edu_cont_"]', 'edu_cont');
  await check('textarea[name^="edu_apl_"]', 'edu_apl');
  await check('textarea[name^="cons_base_"]', 'cons_base');
  await check('textarea[name^="cons_est_"]', 'cons_est');
  await check('input[name^="firma_"]:not([name*="fecha"]):not([name*="final"])', 'firma_idx');
  await check('input[name^="firma_final_col"]', 'firma_final');

  await browser.close();
})();
