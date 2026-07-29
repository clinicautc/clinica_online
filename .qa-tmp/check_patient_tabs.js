const { chromium } = require('playwright');
const http = require('http');
async function redirectDevTunnelToLocalhost(context) {
  await context.route('https://j8kdcqnz-3001.usw3.devtunnels.ms/**', async route => {
    try {
      const req = route.request();
      const url = new URL(req.url());
      const body = req.postDataBuffer();
      const headers = { ...(await req.allHeaders()) };
      delete headers['host']; delete headers['content-length'];
      const upstream = await new Promise((resolve, reject) => {
        const r = http.request(
          { hostname: 'localhost', port: 3001, path: `${url.pathname}${url.search}`, method: req.method(), headers },
          res => { const chunks = []; res.on('data', c => chunks.push(c)); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) })); }
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
  const ctx = await browser.newContext({ timezoneId: 'UTC', viewport: { width: 320, height: 900 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'enriquejesusresendiz@hotmail.com');
  await page.fill('input[type="password"]', 'Paciente1*');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const list = document.querySelector('[data-slot="tabs-list"]');
    const btn = Array.from(document.querySelectorAll('button')).find(b => /confirmar cita/i.test(b.textContent||''));
    return {
      list: list ? { scrollWidth: list.scrollWidth, clientWidth: list.clientWidth, canScroll: list.scrollWidth > list.clientWidth } : null,
      btn: btn ? { rect: btn.getBoundingClientRect(), text: btn.textContent } : null,
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
