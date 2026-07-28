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
    const allSections = Array.from(document.querySelectorAll('section'));
    const matrizSection = allSections.find(s => s.textContent.includes('Matriz IMG/IMLG') && s.textContent.includes('IMLG Muy Alto'));
    const hallazgosSection = allSections.find(s => s.textContent.includes('Hallazgos físicos Orientados'));
    const leftCol = matrizSection.parentElement;

    return {
      leftColRect: leftCol.getBoundingClientRect().toJSON(),
      hallazgosSectionRect: hallazgosSection.getBoundingClientRect().toJSON(),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
