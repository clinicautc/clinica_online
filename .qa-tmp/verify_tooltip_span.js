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

  await page.locator('button[role="combobox"]').first().click();
  await page.waitForTimeout(300);
  await page.locator('[role="option"]:has-text("Fisioterapia")').click();
  await page.waitForTimeout(800);

  const dia29 = page.locator('button:text-is("29"):not(.day-outside)').first();
  await dia29.click();
  await page.waitForTimeout(800);

  const slot1100btn = page.locator('button:text-is("11:00")').first();
  const wrapperTitle = await slot1100btn.evaluate(el => el.parentElement.getAttribute('title'));
  console.log('Title en el span padre del boton 11:00:', wrapperTitle);

  // Verificar que hover realmente muestra el tooltip nativo (via accesibilidad, aunque headless no renderiza el tooltip visual del OS)
  await slot1100btn.hover();
  await page.waitForTimeout(600);

  // Layout: revisar que el boton siga ocupando toda la celda (w-full aplicado)
  const box = await slot1100btn.boundingBox();
  const parentBox = await slot1100btn.evaluate(el => { const r = el.parentElement.getBoundingClientRect(); return { width: r.width, height: r.height }; });
  console.log('Boton box:', JSON.stringify(box), '| span padre box:', JSON.stringify(parentBox));

  await page.screenshot({ path: __dirname + '/screenshots/tooltip_span_final.png', fullPage: true });
  await browser.close();
})();
