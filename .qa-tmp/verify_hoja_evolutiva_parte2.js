// Parte 2: reload → restoreDraft, botón "Guardar" interno (no debe persistir),
// y Finalizar Consulta (sí debe persistir) — cita id 14.
const { chromium } = require('playwright');
const http = require('http');

const CITA_ID = 14;

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

  await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');

  // --- Paso 1: recargar directo al workspace y confirmar restoreDraft ---
  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const abrirFormBtn = page.locator('button, a', { hasText: /seguimiento|evoluci|abrir formulario|continuar/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  const nombreVal = await page.locator('input[name="paciente_nombre"]').first().inputValue().catch(() => null);
  const tallaVal = await page.locator('input[name="antro_talla"]').first().inputValue().catch(() => null);
  console.log('Tras recargar — paciente_nombre:', JSON.stringify(nombreVal), '| antro_talla:', JSON.stringify(tallaVal));
  console.log('restoreDraft OK:', nombreVal === 'David Gonzalez QA Test' && tallaVal === '1.75');

  await page.screenshot({ path: __dirname + '/screenshots/hoja-05-restored.png' });

  // --- Paso 2: botón "Guardar Hoja" interno (no debe persistir a notas_evolutivas) ---
  const guardarBtn = page.locator('button', { hasText: /guardar hoja/i }).first();
  await guardarBtn.click({ timeout: 8000 });
  await page.waitForTimeout(400);
  const confirmBtn = page.locator('button', { hasText: /sí, guardar/i }).first();
  await confirmBtn.click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  await page.screenshot({ path: __dirname + '/screenshots/hoja-06-tras-guardar-interno.png' });
  console.log('URL tras "Guardar Hoja" (debería volver al hub, no navegar fuera):', page.url());

  // --- Paso 3: Finalizar Consulta desde el hub ---
  const finalizarBtn = page.locator('button', { hasText: /finalizar consulta/i }).first();
  const hayFinalizar = await finalizarBtn.count();
  console.log('Botón "Finalizar Consulta" presente:', hayFinalizar > 0);
  if (hayFinalizar) {
    await finalizarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(500);
    const confirmFinalizar = page.locator('button', { hasText: /confirmar|sí|finalizar/i }).last();
    await confirmFinalizar.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: __dirname + '/screenshots/hoja-07-finalizada.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
