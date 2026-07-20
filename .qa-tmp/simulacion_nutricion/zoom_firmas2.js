const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 }, deviceScaleFactor: 3 });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const labelTd = await page.locator('.td-label', { hasText: 'Matrícula' }).first();
  await labelTd.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const table = await page.evaluateHandle(el => el.closest('table'), await labelTd.elementHandle());
  const el = table.asElement();
  await el.screenshot({ path: 'screenshots/zoom_firmas_table.png' });

  const labelTd2 = await page.locator('.td-label', { hasText: 'Indicación' }).first();
  await labelTd2.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const table2 = await page.evaluateHandle(el => el.closest('table'), await labelTd2.elementHandle());
  const el2 = table2.asElement();
  await el2.screenshot({ path: 'screenshots/zoom_interv_table.png' });

  await browser.close();
})();
