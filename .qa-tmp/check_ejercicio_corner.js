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
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await login(page, 'master@edu.utc.mx', 'master123');
  await page.goto(`http://localhost:5173/forms/nutricion/${APPOINTMENT_ID}/documento`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const r = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const t = spans.find(s => s.textContent.trim() === 'Ejercicio');
    return t.closest('section').getBoundingClientRect();
  });
  await page.screenshot({ path: __dirname + '/screenshots/ejercicio_corner.png', clip: { x: r.x - 20, y: r.y - 40, width: r.width + 40, height: 80 } });
  await browser.close();
})();
