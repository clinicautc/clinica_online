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
    const pxToMm = px => +(px * 25.4 / 96).toFixed(2);
    const page2 = document.querySelector('.page2');
    const content = page2.querySelector('.content') || page2;
    function describir(el, depth) {
      if (depth > 3) return null;
      const r = el.getBoundingClientRect();
      const children = Array.from(el.children).map(c => describir(c, depth + 1)).filter(Boolean);
      return { tag: el.tagName, class: el.className, alturaMm: pxToMm(r.height), hijos: children };
    }
    return describir(content, 0);
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
