const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  // --- Desktop: hover ---
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const page = await ctx.newPage();
  const errores = [];
  page.on('pageerror', e => errores.push(e.message));

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

  // Dia 29 (miercoles, tiene cita ocupada a las 11:00)
  const dia29 = page.locator('button:text-is("29"):not(.day-outside)').first();
  await dia29.click();
  await page.waitForTimeout(800);

  const slot1100 = page.locator('button:text-is("11:00")').first();
  await slot1100.hover({ force: true }).catch(async () => {
    // el boton tiene pointer-events:none, forzamos hover sobre el wrapper
    const wrapper = slot1100.locator('xpath=..');
    await wrapper.hover();
  });
  await page.waitForTimeout(300);

  const tooltipVisible = await page.locator('[role="tooltip"]').count();
  const tooltipTexto = tooltipVisible ? await page.locator('[role="tooltip"]').first().textContent() : null;
  console.log('DESKTOP hover -> tooltip visible:', tooltipVisible, '| texto:', tooltipTexto);

  await page.screenshot({ path: __dirname + '/screenshots/tooltip_moderno_desktop.png' });

  console.log('Errores:', JSON.stringify(errores));
  await ctx.close();

  // --- Mobile: tap ---
  const ctxMobile = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const pageMobile = await ctxMobile.newPage();
  await pageMobile.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await pageMobile.fill('input[type="email"]', 'enriquejesusresendiz@hotmail.com');
  await pageMobile.fill('input[type="password"]', 'Paciente1*');
  await pageMobile.click('button[type="submit"]');
  await pageMobile.waitForTimeout(2000);
  await pageMobile.locator('button:has-text("Agendar")').first().click();
  await pageMobile.waitForTimeout(500);
  await pageMobile.locator('button[role="combobox"]').first().click();
  await pageMobile.waitForTimeout(300);
  await pageMobile.locator('[role="option"]:has-text("Fisioterapia")').click();
  await pageMobile.waitForTimeout(800);

  const dia29m = pageMobile.locator('button:text-is("29"):not(.day-outside)').first();
  await dia29m.click();
  await pageMobile.waitForTimeout(800);

  const slot1100m = pageMobile.locator('button:text-is("11:00")').first();
  const wrapperM = slot1100m.locator('xpath=..');
  await wrapperM.tap();
  await pageMobile.waitForTimeout(300);

  const tooltipVisibleM = await pageMobile.locator('[role="tooltip"]').count();
  const tooltipTextoM = tooltipVisibleM ? await pageMobile.locator('[role="tooltip"]').first().textContent() : null;
  console.log('MOBILE tap -> tooltip visible:', tooltipVisibleM, '| texto:', tooltipTextoM);

  await pageMobile.screenshot({ path: __dirname + '/screenshots/tooltip_moderno_mobile.png' });

  await browser.close();
})();
