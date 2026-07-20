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
    const pc = document.querySelector('.page4 .page-content');
    const el = document.querySelector('[name="diag_interp_1"]');
    const tr = el.closest('tr');
    const bioqEl = document.querySelector('[name="bioq_0_col1"]');
    const bioqTr = bioqEl.closest('tr');
    return {
      pageOverflow: pc.scrollHeight > pc.clientHeight + 1,
      pageScrollHeight: pc.scrollHeight, pageClientHeight: pc.clientHeight,
      diagInterpRowHeight: Math.round(tr.getBoundingClientRect().height),
      diagInterpOverflow: el.scrollHeight > el.clientHeight + 1,
      diagInterpScrollH: el.scrollHeight, diagInterpClientH: el.clientHeight,
      bioqRowHeight: Math.round(bioqTr.getBoundingClientRect().height),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
