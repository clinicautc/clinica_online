const engineName = process.argv[2] || 'chromium';
const playwright = require('playwright');
const engine = playwright[engineName];

(async () => {
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });

  const result = await page.evaluate(() => {
    // Simular exactamente lo que hace un traductor: reubicar un nodo hijo
    // fuera de su padre original sin que React se entere.
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);
    document.body.appendChild(parent);

    // El traductor "roba" el nodo y lo mueve a otro lado del DOM.
    document.body.appendChild(child); // ahora child.parentNode !== parent

    const out = { removeChildThrew: false, insertBeforeThrew: false, insertBeforeFellBack: false };

    // 1) React intenta remover un nodo que ya no es su hijo → antes tronaba.
    try {
      parent.removeChild(child);
    } catch (e) {
      out.removeChildThrew = true;
    }

    // 2) React intenta insertar antes de un nodo de referencia que ya no
    //    pertenece al padre esperado → antes tronaba con insertBefore.
    const newNode = document.createElement('b');
    try {
      parent.insertBefore(newNode, child);
      out.insertBeforeFellBack = parent.contains(newNode);
    } catch (e) {
      out.insertBeforeThrew = true;
    }

    return out;
  });

  console.log(`[${engineName}] Resultado de la simulación de corrupción de DOM:`, result);
  if (!result.removeChildThrew && !result.insertBeforeThrew && result.insertBeforeFellBack) {
    console.log(`\n✅ ${engineName}: el parche funciona — ninguna operación lanzó NotFoundError.`);
  } else {
    console.log(`\n❌ ${engineName}: el parche NO está evitando el crash.`);
  }

  await browser.close();
})();
