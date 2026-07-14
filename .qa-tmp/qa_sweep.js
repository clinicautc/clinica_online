const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
const http = require('http');

const SS = path.join(__dirname, 'screenshots', 'qa-sweep');
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
  await page.waitForTimeout(2800);
  if (page.url().includes('/login')) throw new Error(`Login no redirigió (${page.url()})`);
}

const ACCOUNTS = [
  { slug: 'master', email: 'master@edu.utc.mx', password: 'master123', tabs: ['citas agendadas', 'personal acad', 'pacientes', 'estad', 'comunicad'] },
  { slug: 'nutrition-admin', email: 'docente.nutricion@edu.utc.mx', password: 'admin123', tabs: ['citas', 'personal', 'métricas', 'pacientes', 'comunicad'] },
  { slug: 'physio-admin', email: 'docente.fisioterapia@edu.utc.mx', password: 'admin123', tabs: ['citas', 'personal', 'métricas', 'pacientes', 'comunicad'] },
  { slug: 'nutrition-practitioner', email: 'e.resendiz.r688@edu.utc.mx', password: 'Practicante1*', tabs: ['citas de hoy', 'pacientes', 'notas'] },
  { slug: 'physio-practitioner', email: 'maria.fisio@edu.utc.mx', password: 'practicante123', tabs: ['citas de hoy', 'pacientes', 'notas'] },
  { slug: 'patient', email: 'enriquejesusresendiz@hotmail.com', password: 'Paciente1*', tabs: ['agendar', 'mis citas', 'planes'] },
];

const VIEWPORTS = [320, 768, 1440];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const acc of ACCOUNTS) {
    for (const width of VIEWPORTS) {
      const ctx = await browser.newContext({ timezoneId: 'UTC', viewport: { width, height: 900 } });
      await redirectDevTunnelToLocalhost(ctx);
      const page = await ctx.newPage();
      try {
        await login(page, acc.email, acc.password);
      } catch (e) {
        results.push({ acc: acc.slug, width, tab: 'LOGIN', error: e.message });
        await ctx.close();
        continue;
      }
      for (const tabName of acc.tabs) {
        try {
          const tab = page.locator('[role="tab"]').filter({ hasText: new RegExp(tabName, 'i') }).first();
          await tab.waitFor({ timeout: 6000 });
          await tab.click();
          await page.waitForTimeout(600);
        } catch (e) {
          results.push({ acc: acc.slug, width, tab: tabName, error: 'TAB_NOT_FOUND' });
          continue;
        }
        const info = await page.evaluate(() => ({
          overflow: document.body.scrollWidth > window.innerWidth,
          scrollWidth: document.body.scrollWidth,
          viewportWidth: window.innerWidth,
        }));
        const slugTab = tabName.replace(/[^a-zA-Z]/g, '');
        await page.screenshot({ path: path.join(SS, `${acc.slug}-${slugTab}-${width}.png`), fullPage: true }).catch(()=>{});
        results.push({ acc: acc.slug, width, tab: tabName, ...info });
      }
      await ctx.close();
    }
  }

  await browser.close();

  console.log('\n=== RESULTADOS QA SWEEP ===\n');
  let anyIssue = false;
  for (const r of results) {
    const bad = r.error || r.overflow;
    if (bad) anyIssue = true;
    const line = `${bad ? '❌' : '✅'} ${r.acc.padEnd(24)} ${String(r.width).padEnd(5)} ${r.tab.padEnd(20)} ${r.error || (r.overflow ? `OVERFLOW scrollWidth=${r.scrollWidth} vs ${r.viewportWidth}` : 'ok')}`;
    console.log(line);
  }
  console.log(anyIssue ? '\n⚠️  Se encontraron problemas de overflow o tabs no encontrados (ver arriba).' : '\n✅ Sin overflow de página en ningún caso.');
  console.log(`\nScreenshots en ${SS}\n`);
})().catch(err => { console.error('ERROR FATAL:', err.message); process.exit(1); });
