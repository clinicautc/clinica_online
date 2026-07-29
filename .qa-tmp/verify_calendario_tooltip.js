const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const page = await ctx.newPage();

  const errores = [];
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', msg => { if (msg.type() === 'error') errores.push(msg.text()); });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'enriquejesusresendiz@hotmail.com');
  await page.fill('input[type="password"]', 'Paciente1*');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.locator('button:has-text("Agendar")').first().click();
  await page.waitForTimeout(500);

  await page.locator('button[role="combobox"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]:has-text("Fisioterapia")').click();
  await page.waitForTimeout(800);

  // Avanzar a agosto (fines de semana cerrados por dia_semana inactivo)
  const buttons = page.locator('div:has-text("Selecciona una Fecha") >> button');
  await buttons.nth(6).click();
  await page.waitForTimeout(500);

  // Buscar boton "1" (agosto 1, sabado) que no sea day-outside
  const sabado = page.locator('button:text-is("1"):not(.day-outside)').first();
  const wrapperTitleSabado = await sabado.evaluate(el => el.parentElement.getAttribute('title'));
  console.log('Sabado 1 agosto -> title del span padre:', wrapperTitleSabado);

  // Dia entre semana disponible (deberia no tener title)
  const disponible = page.locator('button:text-is("3"):not(.day-outside)').first();
  const wrapperTitleDisp = await disponible.evaluate(el => el.parentElement.getAttribute('title'));
  console.log('Lunes 3 agosto (disponible) -> title:', wrapperTitleDisp);

  console.log('Errores de consola/pagina:', JSON.stringify(errores));

  await page.screenshot({ path: __dirname + '/screenshots/calendario_tooltip.png', fullPage: true });
  await browser.close();
})();
