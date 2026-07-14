const { chromium } = require('playwright');
const http = require('http');

async function redirectDevTunnelToLocalhost(context) {
  await context.route('https://j8kdcqnz-3001.usw3.devtunnels.ms/**', async route => {
    console.log('INTERCEPTED:', route.request().url());
    const req = route.request();
    const url = new URL(req.url());
    const body = req.postDataBuffer();
    const headers = { ...(await req.allHeaders()) };
    delete headers['host'];
    delete headers['content-length'];
    try {
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
      console.log('UPSTREAM STATUS:', upstream.status, 'bodylen', upstream.body.length);
      await route.fulfill({ status: upstream.status, headers: upstream.headers, body: upstream.body });
    } catch (e) {
      console.log('PROXY ERROR', e.message);
      await route.abort();
    }
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ timezoneId: 'UTC' });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));
  page.on('requestfailed', r => console.log('REQFAIL:', r.url(), r.failure()?.errorText));
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  console.log('URL NOW:', page.url());
  await browser.close();
})();
