const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const info = await page.evaluate(() => {
    const pc = document.querySelector('.page .page-content');
    const cs = getComputedStyle(pc);
    const sections = Array.from(pc.querySelectorAll(':scope > .section-row')).map(sr => sr.getBoundingClientRect().height);
    return {
      display: cs.display,
      flexDirection: cs.flexDirection,
      alignItems: cs.alignItems,
      justifyContent: cs.justifyContent,
      height: pc.getBoundingClientRect().height,
      sectionHeights: sections,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
})();
