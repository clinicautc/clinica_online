const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.goto('http://localhost:5173/administrar-personal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const row = page.locator('tr', { hasText: 'Maria Fisio' }).first();
  await row.scrollIntoViewIfNeeded();
  await row.locator('button:has-text("Horario")').click({ force: true });
  await page.waitForTimeout(1200);

  const lunesCard = page.locator('div', { hasText: 'Lunes' }).first();
  const relojBoton = lunesCard.locator('button:has(svg.lucide-clock)').nth(1); // el 2do reloj = hora_fin
  await relojBoton.click();
  await page.waitForTimeout(400);

  // El primer "drum" visible (horas) dentro del panel abierto
  const drumHoras = page.locator('div[style*="height: 180px"]').first();
  const count = await drumHoras.count();
  console.log('Drum encontrado:', count);

  const box = await drumHoras.boundingBox();
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, -50); // subir la hora repetidamente
  }
  await page.waitForTimeout(300);

  const toasts = await page.locator('[data-sonner-toast]').count();
  console.log('Cantidad de toasts visibles simultaneamente tras 10 scrolls rapidos:', toasts);
  const textos = await page.locator('[data-sonner-toast]').allTextContents();
  console.log('Textos:', JSON.stringify(textos));

  await page.screenshot({ path: __dirname + '/screenshots/toast_no_apilado.png' });
  await browser.close();
})();
