const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  page.on('console', m => { if (m.type()==='error') console.log('CONSOLE ERROR:', m.text()); });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const check = await page.evaluate(() => {
    const el = document.querySelector('[name="psi_q0_col6"]');
    return { encontrado: !!el, tag: el?.tagName, url: location.href, bodyLen: document.body.innerText.length };
  });
  console.log(JSON.stringify(check, null, 2));
  await browser.close();
})();
