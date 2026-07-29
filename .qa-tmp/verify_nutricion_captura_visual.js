const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = process.argv[2];

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
  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
  if (await iniciarBtn.count()) { await iniciarBtn.click({ timeout: 8000 }); await page.waitForTimeout(1500); }
  const abrirBtn = page.locator('button', { hasText: /^Comenzar$|continuar llenando/i }).first();
  if (await abrirBtn.count()) { await abrirBtn.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(1200); }
  await page.screenshot({ path: __dirname + '/screenshots/final-01b-nutricion-captura.png', fullPage: true });
  console.log('Nutrición captura — screenshot tomado');

  // También reverificar el botón corregido en modo solo lectura
  await page.goto('http://localhost:5173/forms/nutricion/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const btnCount = await page.locator('button', { hasText: /^Guardar$|Guardado ✓/i }).count();
  console.log('Botón Guardar/Guardado en solo lectura (debe ser 0 tras la corrección):', btnCount);
  await page.screenshot({ path: __dirname + '/screenshots/final-04b-nutricion-readonly-fixed.png', fullPage: true });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
