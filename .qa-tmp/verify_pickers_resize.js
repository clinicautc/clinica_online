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
  await page.waitForTimeout(500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ timezoneId: 'UTC', viewport: { width: 800, height: 500 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  await login(page, 'master@edu.utc.mx', 'master123');
  const tabCitas = page.locator('[role="tab"]').filter({ hasText: /citas agendadas/i }).first();
  await tabCitas.waitFor({ timeout: 8000 });
  await tabCitas.click();
  await page.waitForTimeout(600);

  // Cambiar a modo "Mes" para probar MonthFilterPicker en vez de DateFilterPicker
  const toggleMes = page.locator('button').filter({ hasText: /^mes$/i }).first();
  await toggleMes.waitFor({ timeout: 8000 });
  await toggleMes.click();
  await page.waitForTimeout(400);

  const dateBtn = page.locator('button').filter({ hasText: /^[a-záéíóú]+ \d{4}$/i }).first();
  await dateBtn.waitFor({ timeout: 8000 });
  await dateBtn.click();
  await page.waitForTimeout(400);

  const styleBefore = await page.evaluate(() => {
    const panel = Array.from(document.querySelectorAll('div')).find(d => d.className.includes('shadow-2xl') && d.className.includes('p-3'));
    return panel ? panel.getAttribute('style') : null;
  });
  console.log('Estilo del panel ANTES del resize:', styleBefore);

  // Simular rotación: cambiar drásticamente el viewport mientras el panel sigue abierto
  await page.setViewportSize({ width: 400, height: 700 });
  await page.waitForTimeout(300); // el listener de resize debe recalcular sin necesidad de cerrar/abrir

  const styleAfter = await page.evaluate(() => {
    const panel = Array.from(document.querySelectorAll('div')).find(d => d.className.includes('shadow-2xl') && d.className.includes('p-3'));
    return panel ? panel.getAttribute('style') : null;
  });
  console.log('Estilo del panel DESPUÉS del resize (mismo, sin cerrar):', styleAfter);

  const cambio = styleBefore !== styleAfter;
  console.log(cambio
    ? '\n✅ La posición del panel se recalculó tras el resize (el listener funciona).'
    : '\n❌ La posición NO cambió — o el listener no funciona, o por coincidencia la posición es idéntica en ambos tamaños (revisar visualmente).');

  await page.screenshot({ path: __dirname + '/screenshots/pickers-resize-after.png' });

  await browser.close();
})().catch(err => { console.error('\nERROR:', err.message); process.exit(1); });
