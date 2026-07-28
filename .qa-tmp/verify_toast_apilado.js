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

  // Lunes es el primer dia activo del modal - localizar su segundo TimeScrollPicker (hora_fin)
  const lunesCard = page.locator('div', { hasText: 'Lunes' }).first();
  const horaFinInput = lunesCard.locator('input[placeholder="HH:MM"]').nth(1);
  await horaFinInput.scrollIntoViewIfNeeded();

  const valorAntes = await horaFinInput.inputValue();
  console.log('Hora fin antes:', valorAntes);

  // Scroll rapido hacia arriba (varias veces) sobre el contenedor del input para pasarse del limite (13:00)
  const box = await horaFinInput.boundingBox();
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, -50); // deltaY negativo = subir la hora
  }
  await page.waitForTimeout(300);

  const valorDespues = await horaFinInput.inputValue();
  console.log('Hora fin despues de scrollear rapido:', valorDespues);

  const toasts = await page.locator('[data-sonner-toast]').count();
  console.log('Cantidad de toasts visibles simultaneamente:', toasts);
  const textos = await page.locator('[data-sonner-toast]').allTextContents();
  console.log('Textos:', JSON.stringify(textos));

  await page.screenshot({ path: __dirname + '/screenshots/toast_no_apilado.png' });
  await browser.close();
})();
