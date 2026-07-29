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

  const routes = [
    { url: 'http://localhost:5173/forms/fisioterapia/1/documento', wrapperSelectors: ['.hc-body', '.hc-body-p2', '.hc-body-p3'] },
    { url: 'http://localhost:5173/forms/seguimiento/1/documento', wrapperSelectors: ['.hoja-evolutiva-wrapper'] },
    { url: 'http://localhost:5173/forms/seguimiento-nutricional/78/documento', wrapperSelectors: ['.hoja-evolutiva-wrapper'] },
    { url: 'http://localhost:5173/forms/nutricion/72/documento', wrapperSelectors: ['.p1-outer'] },
  ];

  for (const { url, wrapperSelectors } of routes) {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);

    await page.emulateMedia({ media: 'print' });
    const info = await page.evaluate((sels) => {
      return sels.map(sel => {
        const el = document.querySelector(sel);
        if (!el) return { sel, found: false };
        return { sel, found: true, zoom: getComputedStyle(el).zoom };
      });
    }, wrapperSelectors);
    console.log(url);
    console.log('  bajo emulateMedia(print):', JSON.stringify(info));
    await page.emulateMedia({ media: 'screen' });
  }

  await browser.close();
})();
