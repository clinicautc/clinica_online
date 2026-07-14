const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = 17;

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
  const abrirFormBtn = page.locator('button', { hasText: /^Comenzar$|abrir formulario clínico/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  const tabVisible = await page.locator('text=Historia clínica').first().isVisible().catch(() => false);
  console.log('Tab "Historia clínica" visible (NutricionPrimeraConsultaCaptura montado):', tabVisible);
  await page.screenshot({ path: __dirname + '/screenshots/nutricap-01-p1.png' });

  if (!tabVisible) {
    console.log((await page.content()).slice(0, 2000));
    await browser.close();
    return;
  }

  // Llenar nombre (página 1)
  await page.locator('input').first().fill('placeholder-skip').catch(() => {}); // no-op guard
  const nombreLabel = page.locator('label', { hasText: /^Nombre completo$/i }).first();
  const nombreInput = nombreLabel.locator('xpath=following-sibling::*[1]');
  await nombreInput.fill('Jose Reyes Captura QA').catch(async () => {
    // fallback: primer input de texto visible en la tarjeta "Datos personales"
    await page.locator('input[type="text"]').first().fill('Jose Reyes Captura QA');
  });

  // Ir a pestaña "Dieta y antropometría" y llenar talla/peso
  await page.locator('button[role="tab"]', { hasText: /dieta y antropometría/i }).click();
  await page.waitForTimeout(300);
  const tallaInput = page.locator('text=Talla (m)').locator('xpath=following::input[1]');
  await tallaInput.fill('1.70').catch(() => {});
  await page.screenshot({ path: __dirname + '/screenshots/nutricap-02-p2.png' });

  // Ir a pestaña "Intervención" y llenar firma
  await page.locator('button[role="tab"]', { hasText: /intervención/i }).click();
  await page.waitForTimeout(300);
  const firmaAlumnoLabel = page.locator('label', { hasText: /^Firma alumno$/i }).first();
  const firmaInput = firmaAlumnoLabel.locator('xpath=following-sibling::*[1]');
  await firmaInput.fill('Alumno QA').catch(() => {});
  await page.screenshot({ path: __dirname + '/screenshots/nutricap-03-p4.png' });

  // Anchos responsivos
  for (const [label, size] of [['768', { width: 768, height: 900 }], ['320', { width: 320, height: 800 }]]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await page.screenshot({ path: __dirname + `/screenshots/nutricap-04-${label}.png`, fullPage: true });
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
