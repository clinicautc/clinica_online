const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1300, height: 1000 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  async function shotAround(name, fieldName) {
    const el = page.locator(`[name="${fieldName}"]`).first();
    await el.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(__dirname, 'screenshots', `col6_${name}.png`) });
  }

  await shotAround('psi', 'psi_q0_col6');
  await shotAround('interv_ind', 'interv_ind_col6');
  await shotAround('interv_macro', 'interv_macro_0_col6');
  await shotAround('firma', 'firma_0_col6');
  await shotAround('diag_interp', 'diag_interp_6');
  await shotAround('explor', 'explor_0_col6');

  await browser.close();
  console.log('ok');
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
