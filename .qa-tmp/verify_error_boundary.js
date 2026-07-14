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

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

  // Verificar meta/lang
  const htmlAttrs = await page.evaluate(() => ({
    lang: document.documentElement.getAttribute('lang'),
    translate: document.documentElement.getAttribute('translate'),
    metaNotranslate: !!document.querySelector('meta[name="google"][content="notranslate"]'),
  }));
  console.log('Atributos HTML:', htmlAttrs);

  const loginVisible = await page.locator('text=Iniciar sesión').first().isVisible().catch(() => false);
  console.log('Login visible normalmente (sin error forzado):', loginVisible);

  // Navegar a la ruta de prueba que fuerza un throw real durante el render.
  await page.goto('http://localhost:5173/qa-test-error', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const boundaryVisible = await page.locator('text=Ocurrió un error inesperado').first().isVisible().catch(() => false);
  const reloadBtnVisible = await page.locator('text=Recargar página').first().isVisible().catch(() => false);
  console.log('ErrorBoundary visible tras forzar el error:', boundaryVisible);
  console.log('Botón "Recargar página" visible:', reloadBtnVisible);
  await page.screenshot({ path: __dirname + '/screenshots/error-boundary.png' });

  await browser.close();
})();
