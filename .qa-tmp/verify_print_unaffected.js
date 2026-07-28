const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Disparar beforeprint real (no solo emulateMedia) para forzar el cálculo real de --print-scale.
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await page.waitForTimeout(300);

  const printScales = await page.evaluate(() => Array.from(document.querySelectorAll('.p1-paper')).map(p => p.style.getPropertyValue('--print-scale')));
  console.log('print-scale values tras beforeprint:', printScales);

  await page.pdf({ path: __dirname + '/documento_after_zoom.pdf', printBackground: true, preferCSSPageSize: true });
  console.log('PDF generado.');

  await browser.close();
})();
