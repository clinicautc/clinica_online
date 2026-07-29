const { chromium } = require('playwright');
const fs = require('fs');
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

  const TABLAS = [
    { nombre: 'psi', campo: 'psi_q0_col1', pageClass: 'page' },
    { nombre: 'sint', campo: 'sint_0_col1', pageClass: 'page' },
    { nombre: 'ejer', campo: 'ejer_0_col1', pageClass: 'page' },
    { nombre: 'diet', campo: 'diet_0_col1', pageClass: 'page' },
    { nombre: 'sig', campo: 'sig_0_col1', pageClass: 'page4' },
    { nombre: 'explor', campo: 'explor_0_col1', pageClass: 'page5' },
    { nombre: 'firma', campo: 'firma_0_col1', pageClass: 'page6' },
    { nombre: 'interv_ind', campo: 'interv_ind_col1', pageClass: 'page6' },
  ];

  const resultado = await page.evaluate((tablas) => {
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

    const mmToPx = 279.4 * 96 / 25.4;
    function alturaPagina(pageClass) {
      return document.querySelector('.' + pageClass).getBoundingClientRect().height;
    }

    const salida = {};
    for (const { nombre, campo, pageClass } of tablas) {
      const el = document.querySelector(`[name="${campo}"]`);
      const table = el.closest('table');
      const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
      const labelHeaderCell = headerRow.querySelector('th, td');
      const dataCell = el.closest('td');

      const anchoLabelActual = labelHeaderCell.getBoundingClientRect().width;
      const anchoDataActual = dataCell.getBoundingClientRect().width;
      const alturaInicial = alturaPagina(pageClass);
      const capacidadInicial = capacidad(el);

      // Todas las celdas de etiqueta de esta tabla (para que el ancho de
      // columna cambie de verdad en layout fixed, hay que tocarlas todas).
      const todasLabelCells = Array.from(table.querySelectorAll('tbody td.td-label, tbody td:first-child, tbody th:first-child'))
        .filter(td => !td.querySelector('input,textarea'));
      const labelCellsAAjustar = [headerRow.querySelector('th, td'), ...todasLabelCells];

      let lo = 20, hi = Math.round(anchoLabelActual), mejorSeguro = Math.round(anchoLabelActual);
      while (lo <= hi) {
        const w = Math.floor((lo + hi) / 2);
        labelCellsAAjustar.forEach(c => { c.style.width = w + 'px'; });
        const alturaNueva = alturaPagina(pageClass);
        if (alturaNueva <= alturaInicial + 0.5) { mejorSeguro = w; hi = w - 1; } else { lo = w + 1; }
      }

      // Aplicar el mínimo seguro encontrado y repartir el espacio ganado a
      // las columnas de datos, luego medir capacidad real resultante.
      labelCellsAAjustar.forEach(c => { c.style.width = mejorSeguro + 'px'; });
      const numColsData = 6;
      const espacioGanado = anchoLabelActual - mejorSeguro;
      const nuevoAnchoData = anchoDataActual + (espacioGanado / numColsData);
      const todasDataCellsDeEstaColumna = Array.from(table.querySelectorAll('tbody tr')).map(tr => tr.children[1]);
      todasDataCellsDeEstaColumna.forEach(td => { if (td) td.style.width = nuevoAnchoData + 'px'; });
      const inputEnEstaCelda = dataCell.querySelector('input,textarea');
      if (inputEnEstaCelda) inputEnEstaCelda.style.width = '100%';

      const capacidadFinal = capacidad(el);
      const alturaFinal = alturaPagina(pageClass);

      salida[nombre] = {
        anchoLabelActualPx: Math.round(anchoLabelActual),
        anchoLabelMinimoSeguroPx: mejorSeguro,
        anchoDataAntesPx: Math.round(anchoDataActual),
        anchoDataDespuesPx: Math.round(nuevoAnchoData),
        capacidadAntes: capacidadInicial,
        capacidadDespues: capacidadFinal,
        alturaPaginaAntes: alturaInicial,
        alturaPaginaDespues: alturaFinal,
      };

      // Revertir para no contaminar la siguiente tabla con estilos residuales
      labelCellsAAjustar.forEach(c => { c.style.width = ''; });
      todasDataCellsDeEstaColumna.forEach(td => { if (td) td.style.width = ''; });
      if (inputEnEstaCelda) inputEnEstaCelda.style.width = '';
    }
    return salida;
  }, TABLAS);

  fs.writeFileSync(__dirname + '/analisis_ancho_final.json', JSON.stringify(resultado, null, 2));
  console.log(JSON.stringify(resultado, null, 2));
  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
