// Reproduce el crash de "insertBefore/removeChild NotFoundError" usando el
// motor REAL de Google Translate (el mismo que reescribe el DOM por debajo
// de la traducción nativa de Chrome/Firefox/Edge), no una simulación.
//
// Uso: node verify_real_translate.js <chromium|firefox|webkit>

const engineName = process.argv[2] || 'chromium';
const playwright = require('playwright');
const engine = playwright[engineName];

const GOOGLE_TRANSLATE_SNIPPET = `
  window.__qaTranslateReady = false;
  function googleTranslateElementInit() {
    new google.translate.TranslateElement(
      { pageLanguage: 'es', includedLanguages: 'en', layout: google.translate.TranslateElement.InlineLayout.SIMPLE },
      'google_translate_element'
    );
    window.__qaTranslateReady = true;
  }
`;

async function run() {
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error' && /insertBefore|removeChild|NotFoundError/i.test(msg.text())) {
      pageErrors.push('[console] ' + msg.text());
    }
  });

  await page.goto('http://localhost:5173/register', { waitUntil: 'networkidle' });

  // Inyectar el contenedor + widget real de Google Translate en la propia página.
  await page.evaluate(() => {
    const div = document.createElement('div');
    div.id = 'google_translate_element';
    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.zIndex = '99999';
    document.body.appendChild(div);
  });
  await page.addScriptTag({ content: GOOGLE_TRANSLATE_SNIPPET });
  await page.addScriptTag({ url: 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit' });

  await page.waitForFunction(() => window.__qaTranslateReady === true, { timeout: 15000 }).catch(() => {});
  await page.waitForSelector('select.goog-te-combo', { timeout: 15000 }).catch(() => {});

  // Disparar la traducción real a inglés (equivalente a elegir "English" en
  // el prompt nativo de traducción del navegador).
  await page.evaluate(() => {
    const combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = 'en';
      combo.dispatchEvent(new Event('change'));
    }
  });

  // Dar tiempo a que Translate reescriba el DOM (varios segundos en la vida real).
  await page.waitForTimeout(4000);

  const translateDiag = await page.evaluate(() => ({
    comboExists: !!document.querySelector('select.goog-te-combo'),
    comboValue: document.querySelector('select.goog-te-combo')?.value || null,
    htmlClass: document.documentElement.className,
    fontTagCount: document.querySelectorAll('font').length,
    bodyHasTranslatedMarker: document.body.classList.contains('translated-ltr') || document.body.classList.contains('translated-rtl'),
    sampleText: document.querySelector('h1, h2')?.textContent || null,
  }));
  console.log('Diagnóstico de traducción:', translateDiag);

  // Ahora, mientras el DOM está "corrompido" por la traducción, interactuar
  // con el formulario como lo haría un usuario real registrándose — esto es
  // justo lo que dispara re-renders de React que chocan con los nodos que
  // Translate movió.
  const nombreInput = page.locator('input#nombre, input[name="nombre"], input[placeholder*="ombre" i]').first();
  const hasNombre = await nombreInput.count();
  if (hasNombre) {
    await nombreInput.click({ timeout: 5000 }).catch(() => {});
    await nombreInput.type('Juan Pérez QA', { delay: 40 }).catch(() => {});
  }

  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.count()) {
    await emailInput.click({ timeout: 5000 }).catch(() => {});
    await emailInput.type('juan.perez.qa@example.com', { delay: 40 }).catch(() => {});
  }

  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.count()) {
    await passwordInput.click({ timeout: 5000 }).catch(() => {});
    await passwordInput.type('Prueba123!', { delay: 40 }).catch(() => {});
    await passwordInput.press('Backspace').catch(() => {});
    await passwordInput.type('!', { delay: 40 }).catch(() => {});
  }

  await page.waitForTimeout(1000);

  // Confirmar si el ErrorBoundary (pantalla de crash) quedó visible.
  const boundaryVisible = await page.locator('text=Ocurrió un error inesperado').first().isVisible().catch(() => false);

  await browser.close();

  console.log(`\n=== Motor: ${engineName} ===`);
  console.log('Errores de página capturados:', pageErrors.length ? pageErrors : '(ninguno)');
  console.log('ErrorBoundary (crash) visible:', boundaryVisible);
  if (pageErrors.length === 0 && !boundaryVisible) {
    console.log(`✅ ${engineName}: sin crash con traducción real activada.`);
  } else {
    console.log(`❌ ${engineName}: SÍ ocurrió un crash con traducción real activada.`);
  }
}

run().catch(err => {
  console.error(`\n=== Motor: ${engineName} — ERROR DEL SCRIPT ===`);
  console.error(err);
  process.exit(1);
});
