const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'enriquejesusresendiz@hotmail.com');
  await page.fill('input[type="password"]', 'Paciente1*');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // Buscar el boton de agendar cita / abrir el formulario
  const bodyText = await page.evaluate(() => document.body.innerText);
  console.log('URL tras login:', page.url());

  // Intentar encontrar y clickear un boton de agendar
  const posiblesBotones = ['Agendar', 'Nueva Cita', 'Agendar Cita', 'Agendar nueva cita'];
  let clickeado = false;
  for (const texto of posiblesBotones) {
    const btn = page.locator(`button:has-text("${texto}")`).first();
    if (await btn.count() > 0) {
      await btn.click();
      clickeado = true;
      console.log('Se hizo click en boton:', texto);
      break;
    }
  }
  await page.waitForTimeout(1000);

  await page.screenshot({ path: __dirname + '/screenshots/horario_sync_paso1.png', fullPage: true });
  console.log('clickeado:', clickeado);

  await browser.close();
})();
