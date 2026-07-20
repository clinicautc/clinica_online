const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const el = document.querySelector('[name="psi_q0_col1"]');
    const table = el.closest('table');
    const labelCells = Array.from(table.querySelectorAll('.td-label'));
    return labelCells.map(td => {
      const r = td.getBoundingClientRect();
      return { texto: td.textContent.trim(), widthPx: r.width, heightPx: r.height, scrollHeight: td.scrollHeight, scrollWidth: td.scrollWidth };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
