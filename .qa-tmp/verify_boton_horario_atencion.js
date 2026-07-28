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

  // Buscar el tab que contenga el panel de Horario de Atencion
  await page.locator('button:has-text("Pacientes")').first().click().catch(()=>{});
  await page.waitForTimeout(800);

  let boton = page.locator('button:has-text("Guardar Horario de Atención")').first();
  if (await boton.count() === 0) {
    // probar otros tabs visibles
    const tabs = await page.locator('[role="tab"], button').allTextContents();
    console.log('Tabs/botones visibles:', JSON.stringify(tabs.slice(0,30)));
  }

  console.log('Boton encontrado:', await boton.count());
  if (await boton.count() > 0) {
    console.log('Disabled ANTES de tocar nada:', await boton.isDisabled());
    const clases = await boton.getAttribute('class');
    console.log('Clases:', clases.includes('opacity-50'), clases.includes('bg-slate-300'));
  }

  await page.screenshot({ path: __dirname + '/screenshots/horario_atencion_boton.png', fullPage: true });
  await browser.close();
})();
