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
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await login(page, 'master@edu.utc.mx', 'master123');
  await page.goto(`http://localhost:5173/forms/nutricion/${APPOINTMENT_ID}/documento`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const paper = document.querySelector('.p1-paper');
    const titleEls = Array.from(paper.querySelectorAll('section > span, section > div'));
    const names = ['Antecedentes patológicos heredofamiliares', 'Antecedentes patológicos personales', 'Sintomatología', 'Escala de Bristol', 'Antecedentes personales no pato', 'Diagnósticos médicos'];
    const result = {};
    let sintomaSection = null;
    for (const name of names) {
      const el = titleEls.find(d => d.textContent.trim().startsWith(name));
      if (el) {
        const section = el.closest('section');
        result[name] = section.getBoundingClientRect();
        if (name === 'Sintomatología') sintomaSection = section;
      }
    }
    // Confirm they share the same immediate parent (grid container)
    const parent = sintomaSection.parentElement;
    const bristol = titleEls.find(d => d.textContent.trim().startsWith('Escala de Bristol')).closest('section');
    const sameParent = parent === bristol.parentElement;
    const parentClass = parent.className;
    return { result, sameParent, parentClass };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
