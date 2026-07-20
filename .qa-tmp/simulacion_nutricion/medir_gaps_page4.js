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
    const page4 = document.querySelector('.page4');
    const pageContent = document.querySelector('.page4 .page-content');
    const t1 = document.querySelector('.page4 .tabla-t1');
    const t2 = document.querySelector('.page4 .tabla-t2');
    const t3 = document.querySelector('.page4 .tabla-t3');
    const t4 = document.querySelector('.page4 .tabla-t4');
    const table1 = t1.querySelector('table');
    const thead1 = table1.querySelector('thead tr');
    const rows1 = Array.from(table1.querySelectorAll('tbody tr')).map(r => Math.round(r.getBoundingClientRect().height));
    const r = el => el.getBoundingClientRect();
    return {
      page4: { top: r(page4).top, bottom: r(page4).bottom, height: r(page4).height },
      pageContent: { top: r(pageContent).top, bottom: r(pageContent).bottom, height: r(pageContent).height },
      t1: { top: r(t1).top, bottom: r(t1).bottom, height: r(t1).height },
      t2: { top: r(t2).top, bottom: r(t2).bottom, height: r(t2).height },
      t3: { top: r(t3).top, bottom: r(t3).bottom, height: r(t3).height },
      t4: { top: r(t4).top, bottom: r(t4).bottom, height: r(t4).height },
      theadHeight: Math.round(r(thead1).height),
      bodyRows1: rows1,
      gapPageTopToT1: Math.round(r(t1).top - r(pageContent).top),
      gapT1toT2: Math.round(r(t2).top - r(t1).bottom),
      gapT4toPageContentBottom: Math.round(r(pageContent).bottom - r(t4).bottom),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
