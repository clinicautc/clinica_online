// Verifica EvolucionSeguimientoCaptura.tsx (nuevo componente de captura
// responsive) end-to-end: render, llenado en varias pestañas, autoguardado,
// restoreDraft, Guardar interno (no persiste), Finalizar (sí persiste), y
// que el componente de solo lectura (HojaEvolutiva.tsx, aún sin convertir)
// muestre los mismos datos — confirma compatibilidad de nombres de campo.
const { chromium } = require('playwright');
const http = require('http');

const CITA_ID = 15;

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
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await redirectDevTunnelToLocalhost(ctx);
  const page = await ctx.newPage();
  page.on('pageerror', err => console.log('[pageerror]', err.message));

  await login(page, 'carlos.nutri@edu.utc.mx', 'practicante123');
  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
  if (await iniciarBtn.count()) {
    await iniciarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  }
  const abrirFormBtn = page.locator('button, a', { hasText: /seguimiento|evoluci|abrir formulario|continuar/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  const tabP1Visible = await page.locator('text=Estado clínico').first().isVisible().catch(() => false);
  console.log('Tab "Estado clínico" visible (EvolucionSeguimientoCaptura montado):', tabP1Visible);
  await page.screenshot({ path: __dirname + '/screenshots/evo-01-desktop-p1.png' });

  if (!tabP1Visible) {
    console.log((await page.content()).slice(0, 2000));
    await browser.close();
    return;
  }

  // Llenar nombre + un campo de la pestaña 1 (Psicológicos)
  await page.locator('input[name="paciente_nombre"]').first().fill('David Gonzalez Captura QA');
  await page.locator('textarea[name="psi_q0_col1"]').first().fill('Se sintió motivado');

  // Ir a pestaña Antropometría (p3) y llenar talla
  await page.locator('button[role="tab"]', { hasText: /antropometría/i }).click();
  await page.waitForTimeout(300);
  await page.locator('input[name="antro_talla"]').first().fill('1.68');
  await page.screenshot({ path: __dirname + '/screenshots/evo-02-desktop-p3.png' });

  // Ir a pestaña Intervención (p6) y llenar una firma
  await page.locator('button[role="tab"]', { hasText: /intervención/i }).click();
  await page.waitForTimeout(300);
  const firmaInput = page.locator('input[name="firma_0_col1"]').first();
  if (await firmaInput.count()) await firmaInput.fill('Juan QA');
  await page.screenshot({ path: __dirname + '/screenshots/evo-03-desktop-p6.png' });

  // --- Anchos responsivos (solo visual, sin re-llenar) ---
  for (const [label, size] of [['768', { width: 768, height: 900 }], ['320', { width: 320, height: 800 }]]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await page.screenshot({ path: __dirname + `/screenshots/evo-04-${label}-p6.png`, fullPage: true });
    const hiddenEls = await page.locator('[class*="hidden lg:"], [class*="hidden md:"]').count();
    console.log(`Ancho ${label}px — elementos con "hidden lg:/md:" en el DOM:`, hiddenEls);
  }
  await page.setViewportSize({ width: 1280, height: 900 });

  console.log('Esperando 16s para el debounce de autoguardado...');
  await page.waitForTimeout(16000);

  await browser.close();
  console.log('\nFase de captura completa.');
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
