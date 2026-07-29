const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = 1; // ya tiene historial real persistido

async function redirectDevTunnelToLocalhost(context) {
  await context.route('https://j8kdcqnz-3001.usw3.devtunnels.ms/**', async route => {
    try {
      const req = route.request();
      const url = new URL(req.url());
      const body = req.postDataBuffer();
      const headers = { ...(await req.allHeaders()) };
      delete headers['host'];
      delete headers['content-length'];
      const upstream = await new Promise((resolve, reject) => {
        const r = http.request(
          { hostname: 'localhost', port: 3001, path: `${url.pathname}${url.search}`, method: req.method(), headers },
          res => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
          }
        );
        r.on('error', reject);
        if (body) r.write(body);
        r.end();
      });
      await route.fulfill({ status: upstream.status, headers: upstream.headers, body: upstream.body });
    } catch (e) { await route.abort(); }
  });
}

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  if (page.url().includes('/login')) throw new Error(`Login no redirigió (sigue en ${page.url()})`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  await login(page, 'maria.fisio@edu.utc.mx', 'practicante123');
  await page.goto(`http://localhost:5173/forms/fisioterapia/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const nombreInput = page.locator('.hc-container input[type="text"]').nth(1);
  const nombreVal = await nombreInput.inputValue().catch(() => null);
  console.log('nombre_completo cargado:', JSON.stringify(nombreVal));

  const isDisabled = await nombreInput.evaluate(el => el.matches(':disabled'));
  console.log('input :disabled (por fieldset):', isDisabled);

  await nombreInput.click({ force: true }).catch(() => {});
  await nombreInput.type('INTENTO EDICION', { delay: 20, force: true }).catch(() => {});
  const nombreDespues = await nombreInput.inputValue().catch(() => null);
  console.log('Bloqueo de edición OK:', nombreVal === nombreDespues);

  // Las 3 páginas deben estar apiladas y visibles sin navegar
  const p2Visible = await page.locator('text=Objetivos SMART').first().isVisible().catch(() => false);
  const p3Visible = await page.locator('text=Exploración de sensibilidad').first().isVisible().catch(() => false);
  console.log('Página 2 (Objetivos SMART) visible sin navegar:', p2Visible);
  console.log('Página 3 (Exploración de sensibilidad) visible sin navegar:', p3Visible);

  // Intentar clic en el diagrama de marcadores — no debe agregar un marcador nuevo
  const markerContainer = page.locator('.image-marker-container-p2').first();
  await markerContainer.scrollIntoViewIfNeeded();
  const markersAntes = await page.locator('.marker-p2').count();
  const box = await markerContainer.boundingBox();
  if (box) await page.mouse.click(box.x + box.width * 0.6, box.y + box.height * 0.6);
  await page.waitForTimeout(300);
  const markersDespues = await page.locator('.marker-p2').count();
  console.log('Marcadores p2 antes/después de clic (deben ser iguales, solo lectura):', markersAntes, markersDespues);

  // Botón "Guardar" en página 3 debe estar deshabilitado
  const guardarBtn = page.locator('button', { hasText: /guardado|guardar/i }).last();
  const guardarDisabled = await guardarBtn.evaluate(el => el.matches(':disabled')).catch(() => null);
  console.log('Botón Guardar/Guardado (p3) deshabilitado:', guardarDisabled);

  await page.screenshot({ path: __dirname + '/screenshots/physio-readonly-full.png', fullPage: false });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
