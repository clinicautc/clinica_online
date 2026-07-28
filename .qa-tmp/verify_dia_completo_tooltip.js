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
  await page.waitForTimeout(800);

  const dia17 = page.locator('button:text-is("17"):not(.day-outside)').first();
  const title17 = await dia17.evaluate(el => el.parentElement.getAttribute('title'));
  console.log('17 de agosto (deberia estar lleno) -> title:', title17);

  await page.screenshot({ path: __dirname + '/screenshots/dia_completo_tooltip.png', fullPage: true });
  await browser.close();
})();
