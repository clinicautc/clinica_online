const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = 7;

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
  await page.goto(`http://localhost:5173/forms/nutricion/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Acotado a .p1-paper (Página 1) para no toparse con los inputs de las
  // páginas 2-4 que ahora también están siempre en el DOM (apiladas).
  const nombreInput = page.locator('.p1-paper input[type="text"]').nth(1);
  const nombreAntes = await nombreInput.inputValue().catch(() => null);
  console.log('nombre cargado:', JSON.stringify(nombreAntes));

  const isDisabled = await nombreInput.evaluate(el => el.disabled);
  console.log('input disabled (por fieldset):', isDisabled);

  await nombreInput.click({ force: true }).catch(() => {});
  await nombreInput.type('INTENTO EDICION', { delay: 20, force: true }).catch(() => {});
  const nombreDespues = await nombreInput.inputValue().catch(() => null);
  console.log('valor tras intentar escribir:', JSON.stringify(nombreDespues));
  console.log('Bloqueo de edición OK:', nombreAntes === nombreDespues);

  // Las 4 páginas ahora se muestran apiladas (sin wizard de pasos) — deben
  // estar todas presentes en el DOM sin necesidad de clic alguno.
  const p2Visible = await page.locator('text=Aspectos dietéticos').first().isVisible().catch(() => false);
  const p3Visible = await page.locator('text=Hallazgos físicos').first().isVisible().catch(() => false);
  const p4Visible = await page.locator('text=Cálculo de porciones').first().isVisible().catch(() => false);
  console.log('Página 2 visible sin navegar:', p2Visible);
  console.log('Página 3 visible sin navegar:', p3Visible);
  console.log('Página 4 visible sin navegar:', p4Visible);

  // el.disabled solo refleja el atributo propio del botón, no el estado
  // heredado del fieldset ancestro — :disabled sí refleja el cómputo real.
  const guardarBtn = page.locator('button', { hasText: /^Guardar$/i }).first();
  const guardarDisabled = await guardarBtn.evaluate(el => el.matches(':disabled')).catch(() => null);
  console.log('Botón "Guardar" en página 4 deshabilitado (correcto, solo lectura):', guardarDisabled);

  await page.screenshot({ path: __dirname + '/screenshots/nutrition-readonly-p4.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
