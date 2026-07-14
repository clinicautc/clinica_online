const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = 15;

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

  await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');
  await page.goto(`http://localhost:5173/forms/seguimiento/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const nombreVal = await page.locator('input[name="paciente_nombre"]').first().inputValue().catch(() => null);
  const tallaVal = await page.locator('input[name="antro_talla"]').first().inputValue().catch(() => null);
  const psiVal = await page.locator('textarea[name="psi_q0_col1"]').first().inputValue().catch(() => null);
  const firmaVal = await page.locator('input[name="firma_0_col1"]').first().inputValue().catch(() => null);

  console.log('paciente_nombre:', JSON.stringify(nombreVal));
  console.log('antro_talla:', JSON.stringify(tallaVal));
  console.log('psi_q0_col1:', JSON.stringify(psiVal));
  console.log('firma_0_col1:', JSON.stringify(firmaVal));
  console.log('Compatibilidad de campos OK:',
    nombreVal === 'David Gonzalez Captura QA' &&
    tallaVal === '1.68' &&
    psiVal === 'Se sintió motivado' &&
    firmaVal === 'Juan QA'
  );

  await page.screenshot({ path: __dirname + '/screenshots/evo-06-standalone-hojaevolutiva.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
