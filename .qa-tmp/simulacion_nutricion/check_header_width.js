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
    const th = Array.from(document.querySelectorAll('.page4 .tabla-t1 thead th')).find(t => t.textContent.includes('Diagnóstico'));
    const cs = getComputedStyle(th);
    // temporarily test single-line width requirement
    const span = document.createElement('span');
    span.style.font = cs.font;
    span.style.fontWeight = cs.fontWeight;
    span.style.fontSize = cs.fontSize;
    span.style.whiteSpace = 'nowrap';
    span.style.position = 'absolute';
    span.style.visibility = 'hidden';
    span.textContent = 'Diagnóstico Matriz IMG/IMLG';
    document.body.appendChild(span);
    const neededWidth = span.getBoundingClientRect().width;
    document.body.removeChild(span);
    return {
      thWidth: Math.round(th.getBoundingClientRect().width),
      neededWidthOneLine: Math.round(neededWidth),
      fontSize: cs.fontSize, fontWeight: cs.fontWeight, lineHeight: cs.lineHeight, padding: cs.padding,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
