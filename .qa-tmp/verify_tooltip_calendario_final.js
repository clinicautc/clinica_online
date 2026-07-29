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
  await buttons.nth(6).click(); // agosto
  await page.waitForTimeout(500);

  const sabado = page.locator('button:text-is("1"):not(.day-outside)').first();
  const wrapperSabado = sabado.locator('xpath=..');
  await wrapperSabado.hover();
  await page.waitForTimeout(300);

  const tooltip = page.locator('[role="tooltip"]').first();
  console.log('Tooltip dia cerrado visible:', await tooltip.count() > 0, '| texto:', await tooltip.textContent().catch(()=>null));

  await page.screenshot({ path: __dirname + '/screenshots/tooltip_calendario_final.png' });
  await browser.close();
})();
