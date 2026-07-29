const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = 17;

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
  const abrirFormBtn = page.locator('button', { hasText: /^Comenzar$|abrir formulario clínico|continuar llenando/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }
  await page.locator('button[role="tab"]', { hasText: /dieta y antropometría/i }).click();
  await page.waitForTimeout(300);

  // input[name] es el mismo en desktop y móvil (mismo campo, dos vistas) —
  // apuntar por name garantiza atacar el campo real, y .first() toma la
  // instancia visible en este viewport (desktop).
  const tallaInput = page.locator('input[name="antrop_talla_vo"]').first();
  await tallaInput.fill('1.70');
  const val = await tallaInput.inputValue();
  console.log('Valor tras llenar talla:', JSON.stringify(val));

  // Probar también el patrón "label editable" de Parámetros bioquímicos
  await page.locator('textarea[name="bq_0_nom"]').first().fill('Glucosa').catch(() => {});
  const bqVal = await page.locator('textarea[name="bq_0_nom"]').first().inputValue().catch(() => null);
  console.log('Valor tras llenar bq_0_nom:', JSON.stringify(bqVal));

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
