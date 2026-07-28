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

  const botonGuardar = page.getByRole('button', { name: 'Guardar', exact: true });
  console.log('1) Guardar disabled inicial:', await botonGuardar.isDisabled());

  const contador = page.locator('span.tabular-nums').first();
  console.log('Valor inicial:', await contador.textContent());

  const botonMas = page.locator('button:has(svg.lucide-plus)').first();
  await botonMas.click();
  await page.waitForTimeout(200);
  console.log('Valor tras +1:', await contador.textContent());
  console.log('2) Guardar disabled tras +1:', await botonGuardar.isDisabled());

  await page.screenshot({ path: __dirname + '/screenshots/consultorios_ui.png', fullPage: true });

  const botonMenos = page.locator('button:has(svg.lucide-minus)').first();
  await botonMenos.click();
  await page.waitForTimeout(200);
  console.log('3) Guardar disabled tras revertir:', await botonGuardar.isDisabled());

  await browser.close();
})();
