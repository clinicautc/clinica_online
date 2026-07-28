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

  // Julio 29 real: boton "29" que NO tenga la clase day-outside (esa es junio 29)
  const dia29 = page.locator('button:text-is("29"):not(.day-outside)').first();
  await dia29.click();
  await page.waitForTimeout(800);

  const slot1100 = page.locator('button:text-is("11:00")').first();
  console.log('Existe boton 11:00?', await slot1100.count());
  if (await slot1100.count() > 0) {
    console.log('Slot 11:00 -> disabled:', await slot1100.isDisabled(), '| title:', await slot1100.getAttribute('title'));
  }
  const slot0900 = page.locator('button:text-is("09:00")').first();
  if (await slot0900.count() > 0) {
    console.log('Slot 09:00 -> title:', await slot0900.getAttribute('title'));
  }

  await page.screenshot({ path: __dirname + '/screenshots/tooltip_ocupado.png' });
  await browser.close();
})();
