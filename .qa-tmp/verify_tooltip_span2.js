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

  const spanOcupado = page.locator('span[title="Este horario ya está ocupado por otra cita"]').first();
  console.log('Span encontrado:', await spanOcupado.count());
  await spanOcupado.hover();
  await page.waitForTimeout(400);
  console.log('Hover exitoso sobre el span (esto es lo que el mouse real toca).');

  const box = await spanOcupado.evaluate(el => { const r = el.getBoundingClientRect(); return { w: r.width, h: r.height }; });
  const btnBox = await spanOcupado.evaluate(el => { const r = el.querySelector('button').getBoundingClientRect(); return { w: r.width, h: r.height }; });
  console.log('Span box:', JSON.stringify(box), '| boton interno box:', JSON.stringify(btnBox));

  await browser.close();
})();
