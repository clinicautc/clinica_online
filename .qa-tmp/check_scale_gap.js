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

  const info = await page.evaluate(() => {
    const paper = document.querySelector('.p1-paper');
    const cs = getComputedStyle(paper);
    const spans = Array.from(document.querySelectorAll('span'));
    const t = spans.find(s => s.textContent.trim() === 'Antecedentes gineco-obstétricos');
    const s = t.closest('section');
    const r = s.getBoundingClientRect();
    const divs = Array.from(document.querySelectorAll('section > div'));
    const t2 = divs.find(d => d.textContent.trim() === 'Diagnósticos médicos');
    const s2 = t2.closest('section');
    const r2 = s2.getBoundingClientRect();
    const t3 = divs.find(d => d.textContent.trim() === 'Medicamentos' || (d.textContent.includes('Medicamentos') && d.textContent.includes('Dosis')));
    const s3 = t3 ? t3.closest('section') : null;
    const r3 = s3 ? s3.getBoundingClientRect() : null;
    return {
      screenScale: cs.zoom,
      giniRect: r,
      diagRect: r2,
      medRect: r3,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  const r = info.giniRect;
  await page.screenshot({ path: __dirname + '/screenshots/gap_hi_res.png', clip: { x: r.x - 20, y: r.y - 40, width: r.width + 40, height: 80 } });

  await browser.close();
})();
