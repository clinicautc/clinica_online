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

  await login(page, 'maria.fisio@edu.utc.mx', 'practicante123');
  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
  if (await iniciarBtn.count()) {
    await iniciarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  }
  const abrirFormBtn = page.locator('button', { hasText: /^Comenzar$|continuar llenando|abrir formulario clínico/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  await page.locator('button', { hasText: /siguiente \(p2\)/i }).click({ timeout: 8000 });
  await page.waitForTimeout(600);

  const marcadorContainer = page.locator('.image-marker-container-p2').first();
  await marcadorContainer.scrollIntoViewIfNeeded();
  const box = await marcadorContainer.boundingBox();
  console.log('boundingBox tras scroll:', JSON.stringify(box));
  if (box) {
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.3);
    await page.waitForTimeout(300);
  }
  const markerVisible = await page.locator('.marker-p2').first().isVisible().catch(() => false);
  console.log('Marcador de dolor (p2) visible tras clic:', markerVisible);
  await page.screenshot({ path: __dirname + '/screenshots/physio-06-p2-marker-fixed.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
