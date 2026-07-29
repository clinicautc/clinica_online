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
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const textareas = Array.from(document.querySelectorAll('textarea')).filter(t => {
      const name = t.getAttribute('name');
      return false;
    });
    // Buscar por el contenedor "Recordatorio de 24 horas"
    const section = Array.from(document.querySelectorAll('section')).find(s => s.textContent.includes('Recordatorio de 24 horas') || s.textContent.includes('Contenido (platillo'));
    if (!section) return { error: 'no section found' };
    const rows = Array.from(section.querySelectorAll('.relative.flex-1 > div'));
    return {
      rowCount: rows.length,
      rowHeights: rows.map(r => r.getBoundingClientRect().height),
      containerHeight: section.querySelector('.relative.flex-1')?.getBoundingClientRect().height,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
