const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const check = async (selector) => {
    const vals = await page.evaluate((sel) => Array.from(document.querySelectorAll(sel)).map(el => el.maxLength), selector);
    console.log(selector, 'count=', vals.length, 'maxLength values=', [...new Set(vals)]);
  };
  await check('input[name^="eq_"]');
  await check('input[name^="cn_"]');
  await check('input[name^="int_"]');

  await browser.close();
})();
