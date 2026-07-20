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
    const table = el.closest('table');
    const filas = Array.from(table.querySelectorAll('tr'));
    const alturas = filas.map(f => +f.getBoundingClientRect().height.toFixed(2));
    const suma = alturas.reduce((a,b) => a+b, 0);
    return { totalFilas: filas.length, alturas, sumaPx: suma, sumaMm: +(suma*25.4/96).toFixed(2), tableRect: table.getBoundingClientRect().height };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
