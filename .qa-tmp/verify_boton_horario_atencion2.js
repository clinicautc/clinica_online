const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1400 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.locator('button:has-text("Pacientes")').first().click().catch(()=>{});
  await page.waitForTimeout(800);

  const boton = page.locator('button:has-text("Guardar Horario de Atención")').first();
  console.log('1) Disabled inicial:', await boton.isDisabled());

  // Tocar un dia (toggle activo) - domingo, para no afectar datos reales de un dia con citas
  const domingo = page.locator('div:has-text("Domingo")').last();
  await domingo.click();
  await page.waitForTimeout(300);
  console.log('2) Disabled tras togglear domingo:', await boton.isDisabled());

  // Revertir el toggle (volver a como estaba)
  await domingo.click();
  await page.waitForTimeout(300);
  console.log('3) Disabled tras revertir el toggle (deberia volver a true):', await boton.isDisabled());

  await browser.close();
})();
