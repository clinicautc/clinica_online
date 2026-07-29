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
    const ul = Array.from(document.querySelectorAll('ul')).find(u => u.textContent.includes('En formato SMART'));
    const container = ul.parentElement;
    const textarea = container.querySelector('textarea');
    return {
      containerHeight: container.getBoundingClientRect().height,
      textareaHeight: textarea.getBoundingClientRect().height,
      ulHeight: ul.getBoundingClientRect().height,
      containerBottom: container.getBoundingClientRect().bottom,
      ulTop: ul.getBoundingClientRect().top,
      textareaBottom: textarea.getBoundingClientRect().bottom,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
