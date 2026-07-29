const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
const http = require('http');

const SS = path.join(__dirname, 'screenshots', 'calendar');
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
  const ctx = await browser.newContext({ timezoneId: 'UTC', viewport: { width: 320, height: 700 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  await login(page, 'master@edu.utc.mx', 'master123');
  await page.waitForTimeout(500);

  // El botón de DateFilterPicker suele mostrar la fecha actual o "Seleccionar fecha"
  const tabCitas = page.locator('[role="tab"]').filter({ hasText: /citas agendadas/i }).first();
  await tabCitas.waitFor({ timeout: 8000 });
  await tabCitas.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SS, 'debug-dashboard.png') });

  const dateBtn = page.locator('button').filter({ hasText: /\d{1,2}\s+de\s+\w+,?\s+\d{4}/i }).first();
  await dateBtn.waitFor({ timeout: 8000 });
  await dateBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SS, 'calendar-320.png') });

  const info = await page.evaluate(() => {
    const table = document.querySelector('.rdp-table, table');
    const dayButtons = Array.from(document.querySelectorAll('[name="day"], button[class*="rdp-day"], td button'));
    const headCells = Array.from(document.querySelectorAll('th'));
    const rows = Array.from(document.querySelectorAll('tbody tr'));
    const firstRow = rows[0];
    return {
      tableFound: !!table,
      dayButtonCount: dayButtons.length,
      zeroWidthDayButtons: dayButtons.filter(b => b.getBoundingClientRect().width === 0).length,
      headCellCount: headCells.length,
      firstRowWidth: firstRow ? Math.round(firstRow.getBoundingClientRect().width) : null,
      firstRowScrollWidth: firstRow ? firstRow.scrollWidth : null,
      viewportWidth: window.innerWidth,
      bodyScrollWidth: document.body.scrollWidth,
      pageHasHorizontalOverflow: document.body.scrollWidth > window.innerWidth,
    };
  });
  console.log('\n=== Resultado Calendar @ 320px ===\n');
  console.log(JSON.stringify(info, null, 2));

  await browser.close();
  console.log(`\nScreenshot en ${SS}\n`);
})().catch(err => { console.error('\nERROR:', err.message); process.exit(1); });
