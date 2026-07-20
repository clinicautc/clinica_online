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
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const el = document.querySelector('[name="diag_interp_1"]');
    const td = el.closest('td');
    const tr = td.closest('tr');
    const table = tr.closest('table');
    const allRows = Array.from(table.querySelectorAll('tbody tr')).map(r => Math.round(r.getBoundingClientRect().height));
    return {
      tdHeight: Math.round(td.getBoundingClientRect().height),
      elHeight: Math.round(el.getBoundingClientRect().height),
      elClientHeight: el.clientHeight,
      elCS_height: getComputedStyle(el).height,
      elCS_boxSizing: getComputedStyle(el).boxSizing,
      tdCS_padding: getComputedStyle(td).padding,
      allBodyRowHeights: allRows,
      tableHeight: Math.round(table.getBoundingClientRect().height),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
