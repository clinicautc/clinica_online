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

  // Boton "next month": es el segundo boton dentro del bloque de fecha (el primero es "prev")
  const dateBlock = page.locator('div', { has: page.locator('text=julio 2026') }).first();
  const buttons = page.locator('div:has-text("Selecciona una Fecha") >> button');
  const count = await buttons.count();
  console.log('Cantidad de botones encontrados cerca del calendario:', count);
  for (let i = 0; i < count; i++) {
    const html = await buttons.nth(i).innerHTML();
    console.log(i, html.slice(0,150));
  }

  await browser.close();
})();
