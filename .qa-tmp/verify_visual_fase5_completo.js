// Revisión visual completa de la Fase 5: captura los 6 componentes
// (3 de captura nueva + 3 de solo lectura) en screenshots reales para
// inspección visual manual — no solo aserciones de DOM.
const { chromium } = require('playwright');
const http = require('http');

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

  // ============ 1. NUTRICIÓN — CAPTURA (cita 29, primera) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/consulta/29', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
    if (await iniciarBtn.count()) { await iniciarBtn.click({ timeout: 8000 }); await page.waitForTimeout(1500); }
    const abrirBtn = page.locator('button', { hasText: /^Comenzar$|continuar llenando/i }).first();
    if (await abrirBtn.count()) { await abrirBtn.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(1200); }
    await page.screenshot({ path: __dirname + '/screenshots/final-01-nutricion-captura.png', fullPage: true });
    console.log('1. Nutrición captura — screenshot tomado');
    await ctx.close();
  }

  // ============ 2. FISIOTERAPIA — CAPTURA (cita 30, primera) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'maria.fisio@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/consulta/30', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
    if (await iniciarBtn.count()) { await iniciarBtn.click({ timeout: 8000 }); await page.waitForTimeout(1500); }
    const abrirBtn = page.locator('button', { hasText: /^Comenzar$|continuar llenando/i }).first();
    if (await abrirBtn.count()) { await abrirBtn.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(1200); }
    await page.screenshot({ path: __dirname + '/screenshots/final-02-fisioterapia-captura.png', fullPage: true });
    console.log('2. Fisioterapia captura — screenshot tomado');
    await ctx.close();
  }

  // ============ 3. SEGUIMIENTO — CAPTURA (cita 31, esperado subsecuente) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/consulta/31', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
    if (await iniciarBtn.count()) { await iniciarBtn.click({ timeout: 8000 }); await page.waitForTimeout(1500); }
    const abrirBtn = page.locator('button', { hasText: /^Comenzar$|continuar llenando/i }).first();
    if (await abrirBtn.count()) { await abrirBtn.click({ timeout: 8000 }).catch(() => {}); await page.waitForTimeout(1200); }
    await page.screenshot({ path: __dirname + '/screenshots/final-03-seguimiento-captura.png', fullPage: true });
    console.log('3. Seguimiento captura — screenshot tomado (verificar si es primera o subsecuente)');
    await ctx.close();
  }

  // ============ 4. NUTRICIÓN — SOLO LECTURA (historial real ya existente) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/forms/nutricion/7', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: __dirname + '/screenshots/final-04-nutricion-readonly.png', fullPage: true });
    console.log('4. Nutrición solo lectura — screenshot tomado');
    await ctx.close();
  }

  // ============ 5. FISIOTERAPIA — SOLO LECTURA (historial real ya existente) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'maria.fisio@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/forms/fisioterapia/1', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: __dirname + '/screenshots/final-05-fisioterapia-readonly.png', fullPage: true });
    console.log('5. Fisioterapia solo lectura — screenshot tomado');
    await ctx.close();
  }

  // ============ 6. SEGUIMIENTO — SOLO LECTURA (historial real ya existente, cita 13) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/forms/seguimiento/13', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: __dirname + '/screenshots/final-06-seguimiento-readonly.png', fullPage: true });
    console.log('6. Seguimiento solo lectura — screenshot tomado');
    await ctx.close();
  }

  await browser.close();
  console.log('\nTodos los screenshots generados.');
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
