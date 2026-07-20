const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1000, height: 1400 }, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Página 1: Motivos de consulta / Qx o Tx previos
  const motivos = page.locator('text=Motivos de consulta').first();
  await motivos.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'zoom_p1_motivos.png') });

  // Página 4: Diagnósticos / Objetivo / Educación / Consejería
  const diagBox = page.locator('text=Diagnósticos Nutricios').first();
  await diagBox.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'zoom_p4_diag.png') });

  // Menú del día
  const menu = page.locator('text=Menú del día').first();
  await menu.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(__dirname, 'screenshots', 'zoom_p4_menu.png') });

  await browser.close();
  console.log('ok');
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
