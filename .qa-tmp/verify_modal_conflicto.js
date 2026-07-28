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

  // Asegurarse de estar en Nutricion (deberia ser el default)
  const contador = page.locator('span.tabular-nums').first();
  console.log('Consultorios actuales (deberia ser 3):', await contador.textContent());

  // Bajar a 1 con el boton menos, 2 veces
  const botonMenos = page.locator('button:has(svg.lucide-minus)').first();
  await botonMenos.click();
  await botonMenos.click();
  await page.waitForTimeout(200);
  console.log('Valor tras bajar a 1:', await contador.textContent());

  const botonGuardar = page.getByRole('button', { name: 'Guardar', exact: true });
  await botonGuardar.click();
  await page.waitForTimeout(1000);

  const modalTitulo = page.locator('text=No se puede reducir de inmediato');
  console.log('Modal aparecio:', await modalTitulo.count() > 0);

  const fechaSugerida = await page.locator('p.text-blue-900.font-black.text-lg').first().textContent();
  console.log('Fecha sugerida mostrada:', fechaSugerida);

  await page.screenshot({ path: __dirname + '/screenshots/modal_conflicto.png' });

  // Confirmar con la fecha sugerida
  const botonAplicar = page.locator('button', { hasText: 'Aplicar a partir del' });
  await botonAplicar.click();
  await page.waitForTimeout(1000);

  const bannerPendiente = page.locator('text=Cambio pendiente');
  console.log('Banner de cambio pendiente visible:', await bannerPendiente.count() > 0);
  const textoBanner = await bannerPendiente.locator('xpath=..').textContent().catch(()=>null);
  console.log('Texto del banner:', textoBanner);

  await page.screenshot({ path: __dirname + '/screenshots/consultorios_pendiente.png' });

  await browser.close();
})();
