const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  await ctx.clock.install();
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
  await page.locator('[role="option"]:has-text("Nutrición")').click();
  await page.waitForTimeout(800);

  // Miercoles 29 de julio, actualmente 08:00-24:00 para nutricion
  const dia29 = page.locator('button:text-is("29"):not(.day-outside)').first();
  await dia29.click();
  await page.waitForTimeout(500);

  const labelAntes = await page.locator('label:has-text("Horario Disponible")').textContent();
  console.log('Label ANTES:', labelAntes.trim());

  const token = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email: 'master@edu.utc.mx', password: 'master123' })
    });
    return (await r.json()).accessToken;
  });

  const putResult = await page.evaluate(async ({token}) => {
    const r = await fetch('http://localhost:3001/api/horarios-atencion/nutricion', {
      method: 'PUT',
      headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({ dias: [
        { dia_semana: 1, hora_inicio: '10:00', hora_fin: '24:00', activo: true },
        { dia_semana: 2, hora_inicio: '08:00', hora_fin: '24:00', activo: true },
        { dia_semana: 3, hora_inicio: '08:00', hora_fin: '14:00', activo: true },
        { dia_semana: 4, hora_inicio: '08:00', hora_fin: '24:00', activo: true },
        { dia_semana: 5, hora_inicio: '08:00', hora_fin: '24:00', activo: true },
        { dia_semana: 6, hora_inicio: '08:00', hora_fin: '24:00', activo: false },
        { dia_semana: 7, hora_inicio: '08:00', hora_fin: '24:00', activo: false },
      ] })
    });
    return { status: r.status, body: await r.json() };
  }, {token});
  console.log('PUT horarios nutricion status:', putResult.status);

  await ctx.clock.fastForward(31000);
  await page.waitForTimeout(500);

  const labelDespues = await page.locator('label:has-text("Horario Disponible")').textContent();
  console.log('Label DESPUES (deberia decir 08:00 - 14:00):', labelDespues.trim());

  const slot1500 = await page.locator('button:text-is("15:00")').count();
  console.log('Boton 15:00 sigue existiendo? (deberia ser 0):', slot1500);

  await browser.close();
})();
