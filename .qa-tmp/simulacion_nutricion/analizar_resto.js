const { chromium } = require('playwright');
const fs = require('fs');

// Un campo representativo por sección a analizar (excluye las que ya tienen
// capacidad amplia: diag_matriz, diag_interp, int_bioq_desc, diag_nutri_txt,
// edu_cont/apl, cons_base/est — y antro (type=number, sin riesgo real).
const SECCIONES = {
  sint: 'sint_0_col1',
  ejer: 'ejer_0_col1',
  diet: 'diet_0_col1',
  cual: 'cual_0_col1',
  freq: 'freq_0_col1',
  eq: 'eq_0_col1',
  sig: 'sig_0_col1',
  explor: 'explor_0_col1',
  bioq: 'bioq_0_col1',
  firma: 'firma_0_col1',
};

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

  const resultado = await page.evaluate((secciones) => {
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta '.repeat(30);

    function capacidad(el) {
      const original = el.value;
      const isTextarea = el.tagName === 'TEXTAREA';
      let lo = 0, hi = RELLENO.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2);
        el.value = RELLENO.slice(0, mid);
        const overflow = isTextarea ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;
        if (overflow) hi = mid - 1; else lo = mid;
      }
      el.value = original;
      return lo;
    }

    // Busca el ancho mínimo que una celda de etiqueta puede tener sin que
    // SU PROPIO texto se recorte (revisa TODAS las filas de esa tabla, no
    // solo una, porque la más larga puede estar en cualquier fila).
    function anchoMinimoLabel(tabla) {
      const labelCells = Array.from(tabla.querySelectorAll('td.td-label, td:first-child'))
        .filter(td => !td.querySelector('input,textarea')); // solo celdas de puro texto
      if (labelCells.length === 0) return null;
      const anchoActual = labelCells[0].getBoundingClientRect().width;
      const originalWidths = labelCells.map(td => td.style.width);
      let minSeguro = anchoActual;
      for (let w = Math.round(anchoActual); w >= 20; w -= 4) {
        labelCells.forEach(td => { td.style.width = w + 'px'; });
        const algunOverflow = labelCells.some(td => td.scrollHeight > td.clientHeight + 1 || td.scrollWidth > td.clientWidth + 1);
        if (algunOverflow) break;
        minSeguro = w;
      }
      labelCells.forEach((td, i) => { td.style.width = originalWidths[i]; });
      return { anchoActualPx: Math.round(anchoActual), anchoMinimoPx: minSeguro, filas: labelCells.length };
    }

    const salida = {};
    for (const [nombreSeccion, campoRep] of Object.entries(secciones)) {
      const el = document.querySelector(`[name="${campoRep}"]`);
      if (!el) { salida[nombreSeccion] = 'CAMPO_NO_ENCONTRADO'; continue; }
      const tabla = el.closest('table');
      const dataCellActual = el.closest('td');
      const anchoDataActual = dataCellActual.getBoundingClientRect().width;
      const capacidadActual = capacidad(el);
      const label = anchoMinimoLabel(tabla);

      let capacidadProyectada = null;
      if (label && label.anchoMinimoPx < label.anchoActualPx) {
        const numColsData = tabla.querySelectorAll('thead tr:first-child th').length - 1 || 6;
        const espacioGanado = label.anchoActualPx - label.anchoMinimoPx;
        const nuevoAnchoData = anchoDataActual + (espacioGanado / numColsData);
        const prevWidth = el.style.width;
        const prevTdWidth = dataCellActual.style.width;
        el.style.width = nuevoAnchoData + 'px';
        dataCellActual.style.width = nuevoAnchoData + 'px';
        capacidadProyectada = capacidad(el);
        el.style.width = prevWidth;
        dataCellActual.style.width = prevTdWidth;
      }

      salida[nombreSeccion] = {
        capacidadActual,
        anchoDataActualPx: Math.round(anchoDataActual),
        labelAnchoActualPx: label?.anchoActualPx ?? null,
        labelAnchoMinimoPx: label?.anchoMinimoPx ?? null,
        espacioGanablePx: label ? label.anchoActualPx - label.anchoMinimoPx : 0,
        capacidadProyectada,
      };
    }
    return salida;
  }, SECCIONES);

  fs.writeFileSync(__dirname + '/analisis_resto_secciones.json', JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify(resultado, null, 2));
  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
