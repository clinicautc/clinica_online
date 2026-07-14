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

  // Nutrición solo lectura
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/forms/nutricion/7', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const btn = page.locator('button', { hasText: /guardar|guardado/i }).last();
    const info = await btn.evaluate(el => ({
      text: el.textContent.trim(),
      bg: getComputedStyle(el).backgroundColor,
      disabledAttr: el.disabled,
      matchesDisabled: el.matches(':disabled'),
    }));
    console.log('Nutrición (solo lectura) — botón Guardar:', JSON.stringify(info));
    await ctx.close();
  }

  // Fisioterapia solo lectura
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'maria.fisio@edu.utc.mx', 'practicante123');
    await page.goto('http://localhost:5173/forms/fisioterapia/1', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const btn = page.locator('button', { hasText: /guardar|guardado/i }).last();
    const info = await btn.evaluate(el => ({
      text: el.textContent.trim(),
      bg: getComputedStyle(el).backgroundColor,
      disabledAttr: el.disabled,
      matchesDisabled: el.matches(':disabled'),
    }));
    console.log('Fisioterapia (solo lectura) — botón Guardar:', JSON.stringify(info));
    await ctx.close();
  }

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
