const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
const http = require('http');

const SS = path.join(__dirname, 'screenshots', 'timescrollpicker');
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
  const ctx = await browser.newContext({
    timezoneId: 'UTC',
    viewport: { width: 390, height: 800 },
    hasTouch: true,
    isMobile: true,
  });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  await login(page, 'master@edu.utc.mx', 'master123');

  await page.goto('http://localhost:5173/administrar-personal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Ahora la tabla es dual (tarjetas en móvil, <tr> en escritorio) — buscar de forma
  // agnóstica al viewport: el contenedor más cercano a "Carlos Nutri" que también tenga
  // un botón "Horario".
  const nombre = page.locator('*').filter({ hasText: /^Carlos Nutri$/ }).last();
  await nombre.waitFor({ timeout: 8000 });
  const fila = page.locator('tr, div').filter({ hasText: /Carlos Nutri/i }).filter({ hasText: /horario/i }).first();
  await fila.waitFor({ timeout: 8000 });
  const btnHorario = fila.locator('button').filter({ hasText: /horario/i }).first();
  await btnHorario.click();
  await page.waitForTimeout(600);

  // Activar "Lunes" para revelar los TimeScrollPicker (acotado al diálogo abierto,
  // con texto exacto — "text=Lunes" sin acotar matcheaba "Hoy — lunes 13 de julio")
  const cardLunes = page.locator('[role="dialog"] p').filter({ hasText: /^Lunes$/ }).first();
  await cardLunes.waitFor({ timeout: 8000 });
  await cardLunes.click();
  await page.waitForTimeout(400);

  // Abrir el drum de la primera hora (hora_inicio) haciendo click en el ícono de reloj
  const clockBtn = page.locator('[role="dialog"] button').filter({ has: page.locator('svg') }).nth(0);
  // Más específico: buscar el botón reloj dentro del primer TimeScrollPicker
  const timePicker = page.locator('[role="dialog"]').locator('div').filter({ hasText: /^\d{2}:\d{2}$/ }).first();

  const before = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('[role="dialog"] input[placeholder="HH:MM"]'));
    return inputs.map(i => i.value);
  });
  console.log('Horas ANTES de abrir drum:', before);

  // Click en el botón de reloj dentro del primer TimeScrollPicker visible
  const relojBtns = page.locator('[role="dialog"] input[placeholder="HH:MM"]').first().locator('xpath=following-sibling::button');
  await relojBtns.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SS, '01-drum-abierto.png') });

  // Ubicar el drum de horas (primer contenedor con cursor-grab)
  const drum = page.locator('.cursor-grab').first();
  await drum.waitFor({ timeout: 5000 });
  const box = await drum.boundingBox();
  if (!box) throw new Error('No se encontró el drum de horas');

  const centerX = box.x + box.width / 2;
  const centerY = box.y + box.height / 2;

  const scrollBefore = await page.evaluate(() => window.scrollY);

  // Simular un DRAG TÁCTIL: touchstart en el centro, touchmove 36px hacia arriba (1 item), touchend
  await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    function makeTouch(clientX, clientY) {
      return new Touch({ identifier: 1, target: el, clientX, clientY, pageX: clientX, pageY: clientY });
    }
    el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, cancelable: true, touches: [makeTouch(x, y)], targetTouches: [makeTouch(x, y)], changedTouches: [makeTouch(x, y)] }));
  }, { x: centerX, y: centerY });

  await page.waitForTimeout(100);

  await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    function makeTouch(clientX, clientY) {
      return new Touch({ identifier: 1, target: el, clientX, clientY, pageX: clientX, pageY: clientY });
    }
    const newY = y - 72; // arrastrar 72px hacia arriba = 2 items (ITEM_H=36)
    document.dispatchEvent(new TouchEvent('touchmove', { bubbles: true, cancelable: true, touches: [makeTouch(x, newY)], targetTouches: [makeTouch(x, newY)], changedTouches: [makeTouch(x, newY)] }));
  }, { x: centerX, y: centerY });

  await page.waitForTimeout(100);

  await page.evaluate(() => {
    document.dispatchEvent(new TouchEvent('touchend', { bubbles: true, cancelable: true, touches: [], targetTouches: [], changedTouches: [] }));
  });

  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SS, '02-despues-drag-tactil.png') });

  const after = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('[role="dialog"] input[placeholder="HH:MM"]'));
    return inputs.map(i => i.value);
  });
  const scrollAfter = await page.evaluate(() => window.scrollY);

  console.log('Horas DESPUÉS del drag táctil:', after);
  console.log('Scroll de página antes/después (debe ser igual si preventDefault funcionó):', scrollBefore, scrollAfter);

  if (before[0] === after[0]) {
    console.log('\n❌ El valor NO cambió — el drag táctil no funcionó.');
  } else {
    console.log(`\n✅ El valor cambió de "${before[0]}" a "${after[0]}" — el drag táctil funcionó.`);
  }

  await browser.close();
  console.log(`\nScreenshots en ${SS}\n`);
})().catch(err => { console.error('\nERROR:', err.message); process.exit(1); });
