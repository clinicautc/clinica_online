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
    const tds = Array.from(document.querySelectorAll('.page4 .tabla-t2 tbody .td-label'));
    const cs0 = getComputedStyle(tds[0]);
    return tds.map(td => {
      const span = document.createElement('span');
      span.style.fontSize = cs0.fontSize;
      span.style.fontWeight = getComputedStyle(td).fontWeight;
      span.style.fontFamily = cs0.fontFamily;
      span.style.whiteSpace = 'nowrap';
      span.style.position = 'absolute';
      span.style.visibility = 'hidden';
      span.textContent = td.textContent.trim();
      document.body.appendChild(span);
      const needed = span.getBoundingClientRect().width;
      document.body.removeChild(span);
      return { text: td.textContent.trim(), colWidth: Math.round(td.getBoundingClientRect().width), neededOneLine: Math.round(needed) };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
