// Verifica que HojaEvolutiva.tsx (ya convertido a solo lectura) siga
// mostrando los datos correctamente Y que los inputs realmente bloqueen
// la edición (readOnly real, no solo cosmético).
const { chromium } = require('playwright');
const http = require('http');
const CITA_ID = 13; // ya completada, con datos reales de sesiones previas

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
  await page.goto(`http://localhost:5173/forms/seguimiento/${CITA_ID}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const nombreInput = page.locator('input[name="paciente_nombre"]').first();
  const nombreAntes = await nombreInput.inputValue().catch(() => null);
  console.log('paciente_nombre cargado:', JSON.stringify(nombreAntes));

  const isReadOnly = await nombreInput.evaluate(el => el.readOnly);
  console.log('Atributo readOnly presente en el DOM:', isReadOnly);

  // Intentar escribir (no debería cambiar el valor)
  await nombreInput.click().catch(() => {});
  await nombreInput.type('INTENTO DE EDICION', { delay: 20 }).catch(() => {});
  const nombreDespues = await nombreInput.inputValue().catch(() => null);
  console.log('Valor tras intentar escribir:', JSON.stringify(nombreDespues));
  console.log('Bloqueo de edición funcionando:', nombreAntes === nombreDespues);

  // Botón "Volver" debe existir (y solo ese, sin "Guardar Hoja")
  const volverBtn = await page.locator('button', { hasText: /^Volver$/i }).count();
  const guardarBtn = await page.locator('button', { hasText: /guardar hoja/i }).count();
  console.log('Botón "Volver" presente:', volverBtn > 0);
  console.log('Botón "Guardar Hoja" AUSENTE (correcto en solo lectura):', guardarBtn === 0);

  await page.screenshot({ path: __dirname + '/screenshots/hoja-09-readonly.png' });

  await browser.close();
})().catch(err => {
  console.error('\nERROR:', err.message);
  process.exit(1);
});
