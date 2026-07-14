const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = 16;

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
  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const abrirFormBtn = page.locator('button, a', { hasText: /historia clínica|abrir formulario|continuar|nutrici/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  const nombreCompletoInput = page.locator('input[type="text"]').nth(1);
  const nombreVal = await nombreCompletoInput.inputValue().catch(() => null);
  console.log('Tras recargar — nombre restaurado:', JSON.stringify(nombreVal));
  console.log('restoreDraft OK:', nombreVal === 'Jose Reyes QA Nutricion');

  // Avanzar a la página 4 para llegar al botón "Guardar"
  await page.locator('button', { hasText: /siguiente \(p2\)/i }).click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: /página 3 →/i }).click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('button', { hasText: /página 4 →/i }).click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.screenshot({ path: __dirname + '/screenshots/nutri-03-p4.png' });

  // Guardar interno (no debe persistir)
  const guardarBtn = page.locator('button', { hasText: /^Guardar$/i }).first();
  const hayGuardar = await guardarBtn.count();
  console.log('Botón "Guardar" (interno, página 4) presente:', hayGuardar > 0);
  if (hayGuardar) {
    await guardarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(400);
    const confirmBtn = page.locator('button', { hasText: /sí, guardar/i }).first();
    await confirmBtn.click({ timeout: 8000 });
    await page.waitForTimeout(1200);
    console.log('URL tras "Guardar" interno (debe seguir en el workspace):', page.url());
  }

  // Finalizar consulta desde el hub
  const finalizarBtn = page.locator('button', { hasText: /finalizar consulta/i }).first();
  if (await finalizarBtn.count()) {
    await finalizarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(500);
    const confirmFinalizar = page.locator('button', { hasText: /confirmar|sí|finalizar/i }).last();
    await confirmFinalizar.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: __dirname + '/screenshots/nutri-04-finalizada.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
