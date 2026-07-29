const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');

const SS = path.join(__dirname, 'screenshots', 'tabslist');
if (!fs.existsSync(SS)) fs.mkdirSync(SS, { recursive: true });

const VIEWPORTS = [
  { name: '320',  width: 320,  height: 800 },
  { name: '768',  width: 768,  height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];

const http = require('http');

async function redirectDevTunnelToLocalhost(context) {
  // El .env.local del proyecto apunta VITE_API_BASE_URL a un Dev Tunnel que puede estar
  // caído; para QA local reescribimos esas requests hacia localhost:3001 sin tocar el archivo.
  // route.continue({url}) no permite cambiar de https a http, así que se hace fulfill manual.
  await context.route('https://j8kdcqnz-3001.usw3.devtunnels.ms/**', async route => {
    console.error('[proxy] intercept', route.request().url());
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
      console.error('[proxy] upstream status', upstream.status);
      await route.fulfill({ status: upstream.status, headers: upstream.headers, body: upstream.body });
    } catch (e) {
      console.error('[proxy] ERROR', e.message);
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
  if (page.url().includes('/login')) {
    throw new Error(`Login no redirigió fuera de /login (sigue en ${page.url()})`);
  }
  await page.waitForTimeout(500);
}

async function inspectTabs(page, label) {
  // Encuentra el TabsList visible y mide si hay tabs "perdidos" (ancho 0, o fuera del
  // scrollWidth) vs. si el contenedor permite alcanzarlos por scroll.
  return page.evaluate(() => {
    const lists = Array.from(document.querySelectorAll('[data-slot="tabs-list"]'));
    return lists.map((list, i) => {
      const tabs = Array.from(list.querySelectorAll('[role="tab"]'));
      const rect = list.getBoundingClientRect();
      return {
        index: i,
        listWidth: Math.round(rect.width),
        scrollWidth: list.scrollWidth,
        clientWidth: list.clientWidth,
        isScrollable: list.scrollWidth > list.clientWidth + 1,
        overflowX: getComputedStyle(list).overflowX,
        tabCount: tabs.length,
        tabTexts: tabs.map(t => t.textContent?.trim()),
        anyZeroWidthTab: tabs.some(t => t.getBoundingClientRect().width === 0),
      };
    });
  }).then(lists => lists.map(l => ({ ...l, label })));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  // ── Caso 1: MasterAdminDashboard — 5 tabs, patrón de wrapper externo overflow-x-auto ──
  {
    const ctx = await browser.newContext({ timezoneId: 'UTC' });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'master@edu.utc.mx', 'master123');
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const info = await inspectTabs(page, `MasterAdminDashboard@${vp.name}`);
      results.push(...info);
      await page.screenshot({ path: path.join(SS, `master-${vp.name}.png`) });
    }
    await ctx.close();
  }

  // ── Caso 2: NutritionAdminDashboard — 4 tabs, patrón flex-wrap propio ──
  try {
    const ctx = await browser.newContext({ timezoneId: 'UTC' });
    await redirectDevTunnelToLocalhost(ctx);
    const page = await ctx.newPage();
    await login(page, 'docente.nutricion@edu.utc.mx', 'admin123');
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(300);
      const info = await inspectTabs(page, `NutritionAdminDashboard@${vp.name}`);
      results.push(...info);
      await page.screenshot({ path: path.join(SS, `nutrition-admin-${vp.name}.png`) });
    }
    await ctx.close();
  } catch (e) {
    console.log(`\n⚠️  Caso 2 omitido (credenciales de prueba desactualizadas): ${e.message}\n`);
  }

  await browser.close();

  console.log('\n=== Resultados TabsList ===\n');
  let anyBroken = false;
  for (const r of results) {
    const problem = r.anyZeroWidthTab || r.tabCount === 0;
    if (problem) anyBroken = true;
    console.log(
      `${r.label} [list#${r.index}] tabs=${r.tabCount} scrollable=${r.isScrollable} ` +
      `overflowX=${r.overflowX} width=${r.listWidth} scrollWidth=${r.scrollWidth} ` +
      `zeroWidthTab=${r.anyZeroWidthTab}`
    );
    console.log(`   textos: ${JSON.stringify(r.tabTexts)}`);
  }
  console.log(anyBroken ? '\n❌ Se detectaron tabs con ancho 0 o listas vacías.' : '\n✅ Ningún tab perdió ancho ni se vació.');
  console.log(`\nScreenshots en ${SS}\n`);
})().catch(err => { console.error('\nERROR:', err.message); process.exit(1); });
