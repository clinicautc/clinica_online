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
    const el = document.querySelector('[name="interv_ind_col1"]');
    const td = el.closest('td');
    const tr = td.closest('tr');
    const labelTd = tr.querySelector('.td-label');
    return {
      tr: { height: Math.round(tr.getBoundingClientRect().height) },
      labelTd: {
        widthPx: Math.round(labelTd.getBoundingClientRect().width),
        heightPx: Math.round(labelTd.getBoundingClientRect().height),
        scrollHeight: labelTd.scrollHeight,
        clientHeight: labelTd.clientHeight,
        scrollWidth: labelTd.scrollWidth,
        clientWidth: labelTd.clientWidth,
        overflowsVertically: labelTd.scrollHeight > labelTd.clientHeight + 1,
        overflowsHorizontally: labelTd.scrollWidth > labelTd.clientWidth + 1,
      },
      dataTd: {
        widthPx: Math.round(el.closest('td').getBoundingClientRect().width),
        heightPx: Math.round(el.closest('td').getBoundingClientRect().height),
        textareaScrollHeight: el.scrollHeight,
        textareaClientHeight: el.clientHeight,
      }
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
