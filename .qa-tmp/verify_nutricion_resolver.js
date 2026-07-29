// Verifica NutritionMasterFormRouteResolver en sus dos ramas:
// - cita 7 (ya tiene historial) -> debe montar NutritionMasterForm (viejo)
// - cita 18 (sin historial) -> debe montar NutricionPrimeraConsultaCaptura (nuevo)
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
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');

  // Caso 1: cita CON historial -> componente viejo (tabs "Página 3 →" existen, NO hay Tabs de Radix)
  await page.goto('http://localhost:5173/forms/nutricion/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const tieneTituloImpreso = await page.locator('text=Historia Clínica Nutricional').first().isVisible().catch(() => false);
  const tieneTabsRadix = await page.locator('button[role="tab"]').count();
  console.log('Cita 7 (con historial) — título visible:', tieneTituloImpreso, '| tabs Radix (deben ser 0, es el componente viejo):', tieneTabsRadix);
  await page.screenshot({ path: __dirname + '/screenshots/resolver-01-con-historial.png' });

  // Caso 2: cita SIN historial -> componente nuevo (con Tabs Radix)
  await page.goto('http://localhost:5173/forms/nutricion/18', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const tabsNuevo = await page.locator('button[role="tab"]', { hasText: /historia clínica/i }).count();
  console.log('Cita 18 (sin historial) — tab "Historia clínica" (componente nuevo):', tabsNuevo > 0);
  await page.screenshot({ path: __dirname + '/screenshots/resolver-02-sin-historial.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
