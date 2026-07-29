const { chromium } = require('playwright');
const APPOINTMENT_ID = 72;

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1800 }, deviceScaleFactor: 1.5 });
  const page = await ctx.newPage();
  await login(page, 'master@edu.utc.mx', 'master123');
  await page.goto(`http://localhost:5173/forms/nutricion/${APPOINTMENT_ID}/documento`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const papers = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.p1-paper')).map(p => {
      const r = p.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left, width: r.width, height: r.height };
    });
  });
  console.log(JSON.stringify(papers, null, 2));

  const paperEls = await page.$$('.p1-paper');
  for (let i = 0; i < paperEls.length; i++) {
    await paperEls[i].scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await paperEls[i].screenshot({ path: __dirname + `/screenshots/paper_${i+1}.png` });
  }

  await browser.close();
})();
