// Verificación de regresión cero: HojaEvolutiva.tsx refactorizado a hooks
// (useHojaEvolutivaData + useFormClinicoController) debe comportarse IDÉNTICO
// al componente original. Usa la cita id 14 (nutricion, subsecuente esperado,
// paciente David Gonzalez, practicante Carlos Nutri) creada para esta prueba.

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
  page.on('console', msg => { if (msg.type() === 'error') console.log('[console.error]', msg.text()); });
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');

  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: __dirname + '/screenshots/hoja-01-hub.png' });

  // Iniciar consulta si aún no está activa
  const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
  if (await iniciarBtn.count()) {
    await iniciarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  }

  await page.screenshot({ path: __dirname + '/screenshots/hoja-02-activa.png' });

  // Entrar al formulario de seguimiento/evolución
  const abrirFormBtn = page.locator('button, a', { hasText: /seguimiento|evoluci|abrir formulario|continuar/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1000);
  }

  const wrapperVisible = await page.locator('.hoja-evolutiva-wrapper').first().isVisible().catch(() => false);
  console.log('Wrapper de HojaEvolutiva visible:', wrapperVisible);

  if (!wrapperVisible) {
    await page.screenshot({ path: __dirname + '/screenshots/hoja-03-no-wrapper.png' });
    console.log('HTML del hub para diagnóstico:');
    console.log((await page.content()).slice(0, 3000));
    await browser.close();
    return;
  }

  // Llenar un campo representativo
  const nombreInput = page.locator('input[name="paciente_nombre"]').first();
  await nombreInput.fill('David Gonzalez QA Test');
  const talla = page.locator('input[name="antro_talla"]').first();
  if (await talla.count()) await talla.fill('1.75');

  await page.screenshot({ path: __dirname + '/screenshots/hoja-04-llenado.png' });

  console.log('Esperando 16s para el debounce de autoguardado de borrador...');
  await page.waitForTimeout(16000);

  await browser.close();
  console.log('\nFase de captura completa. Verificar borrador en DB ahora.');
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
