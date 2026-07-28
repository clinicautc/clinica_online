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
  await buttons.nth(6).click(); // next month -> agosto
  await page.waitForTimeout(500);

  // Click en el 3 de agosto (lunes, fisioterapia 08:00-10:00)
  await page.locator('button:text-is("3")').first().click();
  await page.waitForTimeout(800);

  const horasTexto = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll('label')).find(l => l.textContent.includes('Horario Disponible'));
    const rango = label ? label.textContent.trim() : null;
    const botones = Array.from(document.querySelectorAll('button')).filter(b => /^\d{2}:\d{2}$/.test(b.textContent.trim()));
    return { rango, horas: botones.map(b => b.textContent.trim()) };
  });
  console.log('Lunes 3 de agosto (fisioterapia, config 08:00-10:00):', JSON.stringify(horasTexto));

  await page.screenshot({ path: __dirname + '/screenshots/horario_sync_horas_lunes.png', fullPage: true });

  await browser.close();
})();
