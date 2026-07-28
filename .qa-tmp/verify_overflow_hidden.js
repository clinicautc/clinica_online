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

  const psi = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.psi-table textarea')).map(t => {
      const cs = getComputedStyle(t);
      return { overflow: cs.overflow, height: t.clientHeight, scrollHeight: t.scrollHeight };
    });
  });
  console.log('PSI table (A. Psicologicos) sample:', JSON.stringify(psi.slice(0, 3), null, 2));

  const diag = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.tabla-t1 textarea')).map(t => {
      const cs = getComputedStyle(t);
      return { name: t.name, overflow: cs.overflow, height: t.clientHeight, scrollHeight: t.scrollHeight };
    });
  });
  console.log('Diagnostico table (Interpretacion antropometrica):', JSON.stringify(diag, null, 2));

  await page.locator('.psi-table').first().screenshot({ path: __dirname + '/screenshots/psi_table_final.png' });
  await page.locator('.tabla-t1').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.locator('.tabla-t1').first().screenshot({ path: __dirname + '/screenshots/diag_table_final.png' });

  await browser.close();
})();
