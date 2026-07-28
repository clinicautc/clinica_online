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
  await page.waitForTimeout(1000);

  const botonMas = page.locator('button:has(svg.lucide-plus)').first();
  const botonGuardar = page.getByRole('button', { name: 'Guardar', exact: true });
  const contador = page.locator('span.tabular-nums').first();

  await botonMas.click();
  await botonMas.click();
  await page.waitForTimeout(200);
  console.log('Valor antes de guardar:', await contador.textContent());
  await botonGuardar.click();
  await page.waitForTimeout(1000);
  console.log('Guardar disabled tras guardar real (deberia ser true otra vez):', await botonGuardar.isDisabled());

  await browser.close();
})();
