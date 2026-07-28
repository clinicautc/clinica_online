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

  const tryCss = async (css) => {
    await page.addStyleTag({ content: css });
    await page.waitForTimeout(200);
    const info = await page.evaluate(() => {
      const sections = Array.from(document.querySelectorAll('.page .page-content > .section-row'));
      const sr = sections[3];
      const table = sr.querySelector('table');
      const rows = Array.from(table.querySelectorAll('tr'));
      return rows.map(r => r.getBoundingClientRect().height);
    });
    console.log(css.replace(/\s+/g,' ').slice(0,80), '=>', info.map(h => h.toFixed(1)));
  };

  await tryCss(`.page tbody tr { height: 20%; }`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await tryCss(`.page tbody { display: table-row-group; } .page tbody tr { height: 25%; }`);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  await browser.close();
})();
