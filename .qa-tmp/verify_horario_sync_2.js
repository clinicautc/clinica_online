const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'enriquejesusresendiz@hotmail.com');
  await page.fill('input[type="password"]', 'Paciente1*');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("Agendar")').first().click();
  await page.waitForTimeout(500);

  // Seleccionar Fisioterapia en el combobox (Radix Select)
  await page.locator('button[role="combobox"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]:has-text("Fisioterapia")').click();
  await page.waitForTimeout(800);

  // Avanzar al mes de agosto 2026 (donde 8/1 es sabado, 8/2 domingo, 8/3 lunes)
  await page.locator('button:has(svg)').filter({ hasText: '' }).nth(0); // no-op
  const nextBtn = page.locator('.rdp-nav_button_next, button[name="next-month"]').first();
  // fallback genérico: boton con el icono de flecha derecha dentro del calendario
  const calendarNext = page.locator('div:has-text("Selecciona una Fecha") button').nth(1);
  await calendarNext.click().catch(() => {});
  await page.waitForTimeout(500);

  await page.screenshot({ path: __dirname + '/screenshots/horario_sync_calendario.png', fullPage: true });
  console.log('Screenshot del calendario tomado.');

  await browser.close();
})();
