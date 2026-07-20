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
    const el = document.querySelector('[name="freq_0_col1"]');
    const td = el.closest('td');
    const tr = el.closest('tr');
    const csTd = getComputedStyle(td);
    const csEl = getComputedStyle(el);
    return {
      trHeightPx: tr.getBoundingClientRect().height,
      tdHeightPx: td.getBoundingClientRect().height,
      tdComputedHeight: csTd.height,
      tdPadding: csTd.padding,
      tdBorder: csTd.borderWidth,
      elHeightPx: el.getBoundingClientRect().height,
      elComputedHeight: csEl.height,
      elMinHeight: csEl.minHeight,
      elLineHeight: csEl.lineHeight,
      elFontSize: csEl.fontSize,
      elPadding: csEl.padding,
      // ¿Cuántos hermanos <td> tiene esta fila y cuál es la más alta?
      todasLasCeldas: Array.from(tr.querySelectorAll('td')).map(c => c.getBoundingClientRect().height),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
