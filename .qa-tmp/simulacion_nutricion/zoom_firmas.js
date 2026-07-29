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
  const box = await page.evaluate(() => {
    const labelTd = Array.from(document.querySelectorAll('.td-label')).find(td => td.textContent.includes('Matrícula'));
    const table = labelTd.closest('table');
    const r = table.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await page.screenshot({ path: 'screenshots/zoom_firmas_table.png', clip: box });

  const box2 = await page.evaluate(() => {
    const labelTd = Array.from(document.querySelectorAll('.td-label')).find(td => td.textContent.includes('Indicación'));
    const table = labelTd.closest('table');
    const r = table.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  await page.screenshot({ path: 'screenshots/zoom_interv_table.png', clip: box2 });
  await browser.close();
})();
