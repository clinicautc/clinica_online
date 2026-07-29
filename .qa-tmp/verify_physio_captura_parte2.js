const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = process.argv[2] || 27;

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
  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const abrirFormBtn = page.locator('button', { hasText: /^Comenzar$|continuar llenando|abrir formulario clínico/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  const nombreLabel = page.locator('label', { hasText: /^Nombre completo$/i }).first();
  const nombreInput = nombreLabel.locator('xpath=following-sibling::*[1]');
  const nombreVal = await nombreInput.inputValue().catch(() => null);
  console.log('Tras recargar — nombre_completo restaurado:', JSON.stringify(nombreVal));
  console.log('restoreDraft OK:', nombreVal === 'Jose Reyes Fisio Captura QA');

  // Confirmar marcadores restaurados (deben seguir en pantalla, mismo % que antes)
  await page.locator('button[role="tab"]', { hasText: /neuromuscular y movilidad/i }).click();
  await page.waitForTimeout(400);
  const markerRestored = await page.locator('text=✖').first().isVisible().catch(() => false);
  console.log('Marcador de dermatomas restaurado tras reload:', markerRestored);

  // Guardar interno (no debe persistir)
  const guardarBtn = page.locator('button', { hasText: /^Guardar$/i }).first();
  await guardarBtn.click({ timeout: 8000 });
  await page.waitForTimeout(400);
  const confirmBtn = page.locator('button', { hasText: /sí, guardar/i }).first();
  await confirmBtn.click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  console.log('URL tras "Guardar" interno (debe seguir en el workspace):', page.url());

  // Finalizar consulta
  const finalizarBtn = page.locator('button', { hasText: /finalizar consulta/i }).first();
  if (await finalizarBtn.count()) {
    await finalizarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(500);
    const confirmFinalizar = page.locator('button', { hasText: /confirmar|sí|finalizar/i }).last();
    await confirmFinalizar.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(2000);
  }
  await page.screenshot({ path: __dirname + '/screenshots/physiocap-05-finalizada.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
