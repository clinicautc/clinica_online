const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
const http = require('http');

const SS = path.join(__dirname, 'screenshots', 'dialog');
if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true });

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
    } catch (e) {
      await route.abort();
    }
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
  const ctx = await browser.newContext({ timezoneId: 'UTC' });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  await login(page, 'master@edu.utc.mx', 'master123');

  // Ir a la pestaña "Comunicados" y abrir el diálogo "Nueva Publicación"
  const tabComunicados = page.locator('[role="tab"]').filter({ hasText: /comunicad/i }).first();
  await tabComunicados.waitFor({ timeout: 8000 });
  await tabComunicados.click();
  await page.waitForTimeout(500);

  const btnNuevaPublicacion = page.locator('button').filter({ hasText: /nueva publicaci/i }).first();
  await btnNuevaPublicacion.waitFor({ timeout: 8000 });
  await btnNuevaPublicacion.click();
  await page.waitForTimeout(500);

  const viewports = [
    { name: '320x568-normal',  width: 320,  height: 568 },
    { name: '320x400-corto',   width: 320,  height: 400 }, // fuerza que el diálogo exceda el alto disponible
    { name: '768x1024',        width: 768,  height: 1024 },
    { name: '1440x900',        width: 1440, height: 900 },
  ];

  console.log('\n=== Resultados Dialog (max-h-[90vh] overflow-y-auto) ===\n');
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);
    const info = await page.evaluate(() => {
      const content = document.querySelector('[data-slot="dialog-content"]');
      if (!content) return null;
      const cs = getComputedStyle(content);
      const rect = content.getBoundingClientRect();
      return {
        maxHeight: cs.maxHeight,
        overflowY: cs.overflowY,
        scrollHeight: content.scrollHeight,
        clientHeight: content.clientHeight,
        needsScroll: content.scrollHeight > content.clientHeight + 1,
        fitsInViewport: rect.bottom <= window.innerHeight + 1 && rect.top >= -1,
      };
    });
    console.log(`${vp.name}:`, JSON.stringify(info));
    await page.screenshot({ path: path.join(SS, `nueva-publicacion-${vp.name}.png`) });
  }

  await browser.close();
  console.log(`\nScreenshots en ${SS}\n`);
})().catch(err => { console.error('\nERROR:', err.message); process.exit(1); });
