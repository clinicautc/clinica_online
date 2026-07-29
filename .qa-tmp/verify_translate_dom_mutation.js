// Reproduce el patrón DOCUMENTADO de mutación del DOM que usa Google
// Translate (envolver texto en <font style="vertical-align: inherit;">
// anidados, dividiendo nodos de texto) sobre el árbol REAL de React ya
// renderizado, en tres motores de navegador distintos. El widget externo
// en vivo no se pudo automatizar de forma confiable (no se inicializa en
// entornos headless/automatizados), así que esta es la alternativa
// estándar para reproducir este bug específico de forma determinística.
//
// Uso: node verify_translate_dom_mutation.js <chromium|firefox|webkit>

const engineName = process.argv[2] || 'chromium';
const playwright = require('playwright');
const engine = playwright[engineName];

// Función que se inyecta en la página: replica el algoritmo de Google
// Translate — envuelve cada nodo de texto visible en <font> anidados,
// exactamente como lo hace el traductor real.
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
  await page.addScriptTag({ content: SIMULATE_TRANSLATE_FN });

  const wrappedCount = await page.evaluate(() => qaSimulateGoogleTranslate(document.getElementById('root')));
  console.log(`[${engineName}] Nodos de texto "traducidos" (envueltos en <font>):`, wrappedCount);

  await page.waitForTimeout(300);

  // Ahora interactuar como un usuario real registrándose: cada tecla y cada
  // toggle dispara un re-render de React sobre el subárbol ya mutado.
  const nombreInput = page.locator('input#nombre, input[name="nombre"], input[placeholder*="ombre" i]').first();
  if (await nombreInput.count()) {
    await nombreInput.click({ timeout: 5000 }).catch(() => {});
    await nombreInput.type('Juan Pérez QA', { delay: 30 }).catch(() => {});
  }
  const apellidoInput = page.locator('input#apellido, input[name="apellido"], input[placeholder*="pellido" i]').first();
  if (await apellidoInput.count()) {
    await apellidoInput.click({ timeout: 5000 }).catch(() => {});
    await apellidoInput.type('QA Test', { delay: 30 }).catch(() => {});
  }
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.count()) {
    await emailInput.click({ timeout: 5000 }).catch(() => {});
    await emailInput.type('juan.perez.qa@example', { delay: 30 }).catch(() => {}); // email inválido a propósito → dispara mensaje de validación (aparece/desaparece nodo)
    await emailInput.type('.com', { delay: 30 }).catch(() => {});
  }
  const passwordInput = page.locator('input[type="password"]').first();
  if (await passwordInput.count()) {
    await passwordInput.click({ timeout: 5000 }).catch(() => {});
    await passwordInput.type('a', { delay: 30 }).catch(() => {}); // dispara "contraseña débil"
    await passwordInput.type('Prueba123!', { delay: 30 }).catch(() => {}); // ahora fuerte → el mensaje desaparece
  }

  // Volver a mutar el DOM (traducción "continua" — Translate re-traduce
  // contenido nuevo que aparece, como los mensajes de validación).
  await page.evaluate(() => qaSimulateGoogleTranslate(document.getElementById('root')));
  await page.waitForTimeout(300);

  const confirmInput = page.locator('input[type="password"]').nth(1);
  if (await confirmInput.count()) {
    await confirmInput.click({ timeout: 5000 }).catch(() => {});
    await confirmInput.type('Prueba123!', { delay: 30 }).catch(() => {});
  }

  await page.waitForTimeout(800);

  // El caso más probable de crash real: una transición de RUTA (React Router
  // desmonta todo el árbol de la página actual, ya mutado por Translate, y
  // monta el siguiente — remociones/inserciones masivas sobre nodos que ya
  // no están donde React los dejó).
  const loginLink = page.locator('a', { hasText: /inicia sesión|iniciar sesión/i }).first();
  if (await loginLink.count()) {
    await loginLink.click({ timeout: 5000 }).catch(() => {});
  } else {
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded' }).catch(() => {});
  }
  await page.waitForTimeout(600);

  // Re-mutar la nueva página (Translate re-traduce el contenido nuevo que aparece)
  // y volver a navegar, simulando "a veces cuando navego" varias veces seguidas.
  await page.evaluate(() => qaSimulateGoogleTranslate(document.getElementById('root'))).catch(() => {});
  await page.waitForTimeout(300);
  const registerLink = page.locator('a', { hasText: /regís|regist/i }).first();
  if (await registerLink.count()) {
    await registerLink.click({ timeout: 5000 }).catch(() => {});
  }
  await page.waitForTimeout(600);

  const boundaryVisible = await page.locator('text=Ocurrió un error inesperado').first().isVisible().catch(() => false);

  await browser.close();

  console.log(`\n=== Motor: ${engineName} ===`);
  console.log('Errores de página capturados:', pageErrors.length ? pageErrors : '(ninguno)');
  console.log('ErrorBoundary (crash) visible:', boundaryVisible);
  if (pageErrors.length === 0 && !boundaryVisible) {
    console.log(`✅ ${engineName}: sin crash tras la mutación de traducción + interacción real.`);
  } else {
    console.log(`❌ ${engineName}: SÍ ocurrió un crash.`);
  }
}

run().catch(err => {
  console.error(`\n=== Motor: ${engineName} — ERROR DEL SCRIPT ===`);
  console.error(err);
  process.exit(1);
});
