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
  await check('textarea[name^="diag_matriz_"]', 'diag_matriz');
  await check('textarea[name^="diag_interp_"]', 'diag_interp');
  await check('input[name^="sig_"]:not([name*="fecha"])', 'sig_');
  await check('input[name^="bioq_param_"]', 'bioq_param');
  await check('input[name^="bioq_"]:not([name*="fecha"]):not([name*="param"])', 'bioq_col');
  await check('textarea[name^="int_bioq_desc_"]', 'int_bioq_desc');

  await browser.close();
})();
