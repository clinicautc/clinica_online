const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = process.argv[2] || 27;

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

  await login(page, 'maria.fisio@edu.utc.mx', 'practicante123');
  await page.goto(`http://localhost:5173/consulta/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const iniciarBtn = page.locator('button', { hasText: /iniciar consulta/i }).first();
  if (await iniciarBtn.count()) {
    await iniciarBtn.click({ timeout: 8000 });
    await page.waitForTimeout(1500);
  }
  const abrirFormBtn = page.locator('button', { hasText: /^Comenzar$|continuar llenando|abrir formulario clínico/i }).first();
  if (await abrirFormBtn.count()) {
    await abrirFormBtn.click({ timeout: 8000 }).catch(() => {});
    await page.waitForTimeout(1200);
  }

  const tabVisible = await page.locator('text=Historia clínica').first().isVisible().catch(() => false);
  console.log('Tab "Historia clínica" visible (FisioterapiaPrimeraConsultaCaptura montado):', tabVisible);
  await page.screenshot({ path: __dirname + '/screenshots/physiocap-01-p1.png' });

  if (!tabVisible) {
    console.log((await page.content()).slice(0, 2000));
    await browser.close();
    return;
  }

  // Llenar nombre (página 1)
  const nombreLabel = page.locator('label', { hasText: /^Nombre completo$/i }).first();
  await nombreLabel.locator('xpath=following-sibling::*[1]').fill('Jose Reyes Fisio Captura QA').catch(async () => {
    await page.locator('input[type="text"]').first().fill('Jose Reyes Fisio Captura QA');
  });

  // Ir a pestaña "Objetivos y exploración" y hacer clic en el marcador de dolor
  await page.locator('button[role="tab"]', { hasText: /objetivos y exploración/i }).click();
  await page.waitForTimeout(400);
  const bodyImg = page.locator('img[alt="Ubicación cuerpo"]').first();
  const container = bodyImg.locator('xpath=..');
  await container.scrollIntoViewIfNeeded();
  const box = await container.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width * 0.4, box.y + box.height * 0.3);
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: __dirname + '/screenshots/physiocap-02-p2-marker.png' });

  // Ir a pestaña "Neuromuscular y movilidad" y hacer clic en el marcador de dermatomas
  await page.locator('button[role="tab"]', { hasText: /neuromuscular y movilidad/i }).click();
  await page.waitForTimeout(400);
  const bodyImg2 = page.locator('img[alt="Dermatomas"]').first();
  const container2 = bodyImg2.locator('xpath=..');
  await container2.scrollIntoViewIfNeeded();
  const box2 = await container2.boundingBox();
  if (box2) {
    await page.mouse.click(box2.x + box2.width * 0.5, box2.y + box2.height * 0.4);
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: __dirname + '/screenshots/physiocap-03-p3-marker.png' });

  // Anchos responsivos
  for (const [label, size] of [['768', { width: 768, height: 900 }], ['320', { width: 320, height: 800 }]]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(300);
    await page.screenshot({ path: __dirname + `/screenshots/physiocap-04-${label}.png`, fullPage: true });
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
