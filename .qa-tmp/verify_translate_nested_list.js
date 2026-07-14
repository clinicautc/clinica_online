// Intento final de reproducción: el stack trace original del usuario muestra
// insertOrAppendPlacementNode anidado 3 veces — típico de una LISTA ANIDADA
// reordenándose (ej. vista "Mes" agrupada por día, con tarjetas de citas
// dentro de cada día). Se traduce el DOM y luego se cambia de vista/mes para
// forzar exactamente ese tipo de reordenamiento con keys.
//
// Uso: node verify_translate_nested_list.js <chromium|firefox|webkit>

const engineName = process.argv[2] || 'chromium';
const playwright = require('playwright');
const engine = playwright[engineName];
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

const SIMULATE_TRANSLATE_FN = `
  function qaSimulateGoogleTranslate(root) {
    let wrapped = 0;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const tag = node.parentElement && node.parentElement.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const textNodes = [];
    let n;
    while ((n = walker.nextNode())) textNodes.push(n);
    textNodes.forEach(textNode => {
      const parent = textNode.parentNode;
      if (!parent) return;
      const outer = document.createElement('font');
      outer.style.verticalAlign = 'inherit';
      const inner = document.createElement('font');
      inner.style.verticalAlign = 'inherit';
      inner.textContent = textNode.nodeValue;
      outer.appendChild(inner);
      parent.replaceChild(outer, textNode);
      wrapped++;
    });
    return wrapped;
  }
`;

async function login(page, email, password) {
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  if (page.url().includes('/login')) throw new Error(`Login no redirigió (sigue en ${page.url()})`);
  await page.waitForTimeout(500);
}

async function run() {
  const browser = await engine.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && /insertBefore|removeChild|NotFoundError/i.test(msg.text())) {
      pageErrors.push('[console] ' + msg.text());
    }
  });

  await login(page, 'master@edu.utc.mx', 'master123');
  await page.waitForTimeout(1000);
  await page.addScriptTag({ content: SIMULATE_TRANSLATE_FN });

  // Cambiar a vista "Mes" si existe el toggle (ViewModeToggle)
  const mesBtn = page.locator('button', { hasText: /^Mes$/i }).first();
  if (await mesBtn.count()) {
    await mesBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  }

  const wrapped1 = await page.evaluate(() => qaSimulateGoogleTranslate(document.getElementById('root')));
  console.log(`[${engineName}] Traducción inicial: ${wrapped1} nodos envueltos`);
  await page.waitForTimeout(300);

  // Navegar de mes (MonthFilterPicker) — dispara reordenamiento de la lista anidada
  // día → citas.
  for (let i = 0; i < 3; i++) {
    const monthTrigger = page.locator('button, div').filter({ hasText: /\d{4}/ }).first();
    // Intentar los botones de flecha genéricos junto al selector de mes/fecha
    const arrowBtns = page.locator('button').filter({ has: page.locator('svg') });
    const count = await arrowBtns.count();
    if (count > 0) {
      await arrowBtns.nth(0).click({ timeout: 3000 }).catch(() => {});
    }
    await page.waitForTimeout(500);
    await page.evaluate(() => qaSimulateGoogleTranslate(document.getElementById('root'))).catch(() => {});
  }

  // También alternar pestañas (Tabs) si existen — otro reordenamiento con keys.
  const tabButtons = page.locator('[role="tab"]');
  const tabCount = await tabButtons.count();
  for (let i = 0; i < Math.min(tabCount, 4); i++) {
    await tabButtons.nth(i).click({ timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.evaluate(() => qaSimulateGoogleTranslate(document.getElementById('root'))).catch(() => {});
  }

  await page.waitForTimeout(800);
  const boundaryVisible = await page.locator('text=Ocurrió un error inesperado').first().isVisible().catch(() => false);

  await browser.close();

  console.log(`\n=== Motor: ${engineName} (lista anidada) ===`);
  console.log('Errores de página capturados:', pageErrors.length ? pageErrors : '(ninguno)');
  console.log('ErrorBoundary (crash) visible:', boundaryVisible);
  if (pageErrors.length === 0 && !boundaryVisible) {
    console.log(`✅ ${engineName}: sin crash.`);
  } else {
    console.log(`❌ ${engineName}: SÍ ocurrió un crash.`);
  }
}

run().catch(err => {
  console.error(`\n=== Motor: ${engineName} — ERROR DEL SCRIPT ===`);
  console.error(err);
  process.exit(1);
});
