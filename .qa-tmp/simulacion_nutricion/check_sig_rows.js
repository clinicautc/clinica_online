const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('.page4 .tabla-t2 tbody tr')).map(r => ({
      label: r.querySelector('.td-label').textContent.trim(),
      height: Math.round(r.getBoundingClientRect().height),
      labelWraps: r.querySelector('.td-label').scrollHeight > r.querySelector('.td-label').clientHeight + 1,
    }));
    return rows;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
