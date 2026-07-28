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

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Buscar el panel de horario de atencion - puede estar en un tab
  const tabBtn = page.locator('button, [role="tab"]', { hasText: /Horario de atenci/i }).first();
  if (await tabBtn.count()) {
    await tabBtn.click();
    await page.waitForTimeout(800);
  }

  // Crear un cierre de prueba con fecha futura
  const fechaInput = page.locator('input[type="date"]').first();
  if (await fechaInput.count()) {
    const target = new Date();
    target.setDate(target.getDate() + 10);
    const iso = target.toISOString().split('T')[0];
    await fechaInput.fill(iso);
    await page.click('button:has-text("Cerrar día")');
    await page.waitForTimeout(1500);
  }

  const text = await page.evaluate(() => document.body.innerText);
  console.log('Contiene "Invalid Date":', text.includes('Invalid Date'));
  const cierreBox = await page.locator('p.text-red-800').first().textContent().catch(() => null);
  console.log('Texto del cierre mostrado:', cierreBox);

  await browser.close();
})();
