const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
const http = require('http');

const SS = path.join(__dirname, 'screenshots', 'master-dashboard');
if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true });

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
  const VP = { width: parseInt(process.argv[2] || '320'), height: 900 };
  const ctx = await browser.newContext({ timezoneId: 'UTC', viewport: VP });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  await login(page, 'master@edu.utc.mx', 'master123');

  const tabs = ['citas agendadas', 'personal acad', 'pacientes', 'estad', 'comunicad'];
  for (const tabName of tabs) {
    const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(tabName, 'i') }).first();
    await tab.waitFor({ timeout: 8000 });
    await tab.click();
    await page.waitForTimeout(700);
    const slug = tabName.replace(/[^a-z]/gi, '');
    await page.screenshot({ path: path.join(SS, `${slug}-${VP.width}-full.png`), fullPage: true });
    const info = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      overflow: document.body.scrollWidth > window.innerWidth,
    }));
    console.log(`${tabName} @ 320px:`, JSON.stringify(info));

    if (tabName === 'comunicad') {
      const debug = await page.evaluate(() => {
        const titleEl = Array.from(document.querySelectorAll('[data-slot="card-title"]')).find(e => e.textContent?.includes('CENTRO'));
        const chain = [];
        let el = titleEl;
        for (let i = 0; i < 8 && el; i++) {
          const cs = getComputedStyle(el);
          chain.push({
            tag: el.tagName, cls: el.className?.toString().slice(0, 80),
            width: Math.round(el.getBoundingClientRect().width),
            display: cs.display, flexDirection: cs.flexDirection, whiteSpace: cs.whiteSpace, minWidth: cs.minWidth,
          });
          el = el.parentElement;
        }
        return chain;
      });
      console.log('Cadena de ancestros de "CENTRO DE COMUNICADOS":', JSON.stringify(debug, null, 2));
    }

    if (tabName === 'estad') {
      const toggleInfo = await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button')).filter(b => /^(todo|nutrici[oó]n|fisioterapia)$/i.test(b.textContent?.trim() || ''));
        return btns.map(b => ({ text: b.textContent?.trim(), rect: b.getBoundingClientRect() }));
      });
      console.log('Toggle TODO/NUTRICIÓN/FISIOTERAPIA:', JSON.stringify(toggleInfo, null, 2));

      const kpiInfo = await page.evaluate(() => {
        const labels = ['Total Citas', 'Completadas', 'Canceladas', 'Re-agendadas', 'Programadas'];
        return labels.map(l => {
          const el = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.textContent?.trim() === l);
          const rect = el ? el.getBoundingClientRect() : null;
          return { label: l, found: !!el, visibleInViewport: rect ? (rect.right <= 320 && rect.right > 0) : null, rect };
        });
      });
      console.log('KPI cards (Total/Completadas/Canceladas/Re-agendadas/Programadas):', JSON.stringify(kpiInfo, null, 2));
    }
  }

  await browser.close();
  console.log(`Screenshots en ${SS}`);
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
