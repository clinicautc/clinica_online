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

  const buttons = page.locator('div:has-text("Selecciona una Fecha") >> button');
  await buttons.nth(6).click(); // next month
  await page.waitForTimeout(500);

  await page.screenshot({ path: __dirname + '/screenshots/horario_sync_agosto.png', fullPage: true });

  // Revisar clases de los dias sabado (dia_semana 6) para ver si estan deshabilitados
  const diasInfo = await page.evaluate(() => {
    const cells = Array.from(document.querySelectorAll('button')).filter(b => /^\d{1,2}$/.test(b.textContent.trim()));
    return cells.map(c => ({ texto: c.textContent.trim(), disabled: c.disabled, clases: c.className }));
  });
  console.log(JSON.stringify(diasInfo, null, 2));

  await browser.close();
})();
