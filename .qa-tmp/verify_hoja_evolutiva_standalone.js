// Verifica el modo standalone: /forms/seguimiento/:id debe cargar (GET) los
// datos ya persistidos de la cita 14 e hidratarlos correctamente.
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

  await page.goto(`http://localhost:5173/forms/seguimiento/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const wrapperVisible = await page.locator('.hoja-evolutiva-wrapper').first().isVisible().catch(() => false);
  const nombreVal = await page.locator('input[name="paciente_nombre"]').first().inputValue().catch(() => null);
  const tallaVal = await page.locator('input[name="antro_talla"]').first().inputValue().catch(() => null);

  console.log('Wrapper visible:', wrapperVisible);
  console.log('paciente_nombre:', JSON.stringify(nombreVal));
  console.log('antro_talla:', JSON.stringify(tallaVal));
  console.log('Standalone load OK:', nombreVal === 'David Gonzalez QA Test' && tallaVal === '1.75');

  await page.screenshot({ path: __dirname + '/screenshots/hoja-08-standalone.png' });

  // Botón "Volver" debe existir en modo standalone (props.formKey ausente)
  const volverBtn = page.locator('button', { hasText: /volver/i }).first();
  console.log('Botón "Volver" presente (esperado en standalone):', await volverBtn.count() > 0);

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
