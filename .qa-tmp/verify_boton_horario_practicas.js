const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  await page.goto('http://localhost:5173/administrar-personal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const row = page.locator('tr', { hasText: 'Maria Fisio' }).first();
  await row.scrollIntoViewIfNeeded();
  await row.locator('button:has-text("Horario")').click({ force: true });
  await page.waitForTimeout(1200);

  const boton = page.locator('button:has-text("Guardar Horario de Prácticas")').first();
  console.log('Boton encontrado:', await boton.count());
  console.log('1) Disabled inicial:', await boton.isDisabled());
  const clases = await boton.getAttribute('class');
  console.log('Tiene clases de apagado:', clases?.includes('opacity-50'), clases?.includes('bg-slate-300'));

  // Togglear un dia activo -> inactivo (o viceversa) para generar un cambio
  const primerDia = page.locator('div', { hasText: 'Lunes' }).first();
  await primerDia.click();
  await page.waitForTimeout(300);
  console.log('2) Disabled tras togglear un dia:', await boton.isDisabled());

  await primerDia.click();
  await page.waitForTimeout(300);
  console.log('3) Disabled tras revertir (deberia ser true):', await boton.isDisabled());

  await page.screenshot({ path: __dirname + '/screenshots/horario_practicas_boton.png' });
  await browser.close();
})();
