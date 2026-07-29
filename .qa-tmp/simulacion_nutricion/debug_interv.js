const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const out = {};
    for (const col of [1, 6]) {
      const el = document.querySelector(`[name="interv_ind_col${col}"]`);
      const cs = getComputedStyle(el);
      out[col] = {
        value: el.value,
        clientWidth: el.clientWidth, clientHeight: el.clientHeight,
        scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight,
        whiteSpace: cs.whiteSpace, overflowY: cs.overflowY, resize: cs.resize,
        parentTdHeight: el.closest('td')?.getBoundingClientRect().height,
      };
    }
    return out;
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
