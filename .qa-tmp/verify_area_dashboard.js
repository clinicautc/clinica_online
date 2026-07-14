const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
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

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  if (page.url().includes('/login')) throw new Error(`Login no redirigió (sigue en ${page.url()})`);
  await page.waitForTimeout(500);
}

// Uso: node verify_area_dashboard.js <slug> <email> <password> <ancho> <tab1,tab2,...>
(async () => {
  const [slug, email, password, widthArg, tabsArg] = process.argv.slice(2);
  const width = parseInt(widthArg || '320');
  const tabs = (tabsArg || 'citas,personal,pacientes,estad,comunicad').split(',');

  const SS = path.join(__dirname, 'screenshots', slug);
  if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ timezoneId: 'UTC', viewport: { width, height: 900 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  await login(page, email, password);

  for (const tabName of tabs) {
    const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(tabName, 'i') }).first();
    try {
      await tab.waitFor({ timeout: 8000 });
      await tab.click();
      await page.waitForTimeout(700);
    } catch (e) {
      console.log(`⚠️  Tab "${tabName}" no encontrado, salto.`);
      continue;
    }
    const slugTab = tabName.replace(/[^a-z]/gi, '');
    await page.screenshot({ path: path.join(SS, `${slugTab}-${width}.png`), fullPage: true });
    const info = await page.evaluate(() => ({
      bodyScrollWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      overflow: document.body.scrollWidth > window.innerWidth,
    }));
    console.log(`${tabName} @ ${width}px:`, JSON.stringify(info));
  }

  await browser.close();
  console.log(`Screenshots en ${SS}`);
})().catch(err => { console.error('ERROR:', err.message); process.exit(1); });
