const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const info = await page.evaluate(() => {
    const el = document.querySelector('[name="psi_q0_col1"]');
    const table = el.closest('table');
    const labelCells = Array.from(table.querySelectorAll('.td-label'));
    // La celda más "apretada" (menor margen entre scrollHeight y clientHeight)
    const td = labelCells[4]; // la más larga de texto
    const originalWidth = td.style.width;
    const originalHeight = td.closest('tr').style.height;
    let lo = 244, hi = 500; // ancho mínimo tal que NO haya overflow (buscamos hacia abajo desde 244 ya sabemos que cabe)
    // Buscamos el mínimo ancho que sigue sin overflow, bajando desde 244
    let minSinOverflow = 244;
    for (let w = 244; w >= 100; w -= 4) {
      td.style.width = w + 'px';
      const overflow = td.scrollHeight > td.clientHeight + 1;
      if (overflow) break;
      minSinOverflow = w;
    }
    td.style.width = originalWidth;
    return { textoMasLargo: td.textContent.trim(), anchoMinimoSinOverflow: minSinOverflow };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
