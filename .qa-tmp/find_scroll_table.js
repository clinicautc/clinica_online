const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // find the element containing the text
  const target = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while (node = walker.nextNode()) {
      if (node.textContent.includes('Sintió ansiedad inicial')) {
        let el = node.parentElement;
        const path = [];
        let cur = el;
        while (cur && cur !== document.body) {
          path.push(cur.tagName + (cur.className ? '.' + String(cur.className).replace(/ /g,'.') : ''));
          cur = cur.parentElement;
        }
        return { text: node.textContent, path };
      }
    }
    return null;
  });
  console.log(JSON.stringify(target, null, 2));

  await browser.close();
})();
