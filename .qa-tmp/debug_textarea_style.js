const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1800 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const section = Array.from(document.querySelectorAll('section')).find(s => s.textContent.includes('Contenido (platillo'));
    const textareas = Array.from(section.querySelectorAll('textarea'));
    return textareas.map((t, i) => {
      const cs = getComputedStyle(t);
      const rect = t.getBoundingClientRect();
      return {
        idx: i,
        value: t.value.slice(0, 30),
        overflow: cs.overflow,
        overflowY: cs.overflowY,
        height: rect.height,
        scrollHeight: t.scrollHeight,
      };
    });
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
