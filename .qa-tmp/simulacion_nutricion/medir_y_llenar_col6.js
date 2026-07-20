const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// --- 1. Lista exacta de campos de la columna 6 (más los "fila 6" y los globales
//     que se tocan al guardar) que vamos a medir uno por uno para saber su
//     capacidad real, y luego llenar ocupando ese máximo. ---
const COL = 6;
const CAMPOS_COL6 = [
  ...[0, 1, 2, 3, 4].map(i => `psi_q${i}_col${COL}`),
  ...[...Array(12).keys()].map(i => `sint_${i}_col${COL}`), 'sint_12_col' + COL,
  ...[0, 1, 2, 3, 4, 5, 6, 7].map(i => `ejer_${i}_col${COL}`),
  ...[0, 1, 2, 3].map(i => `diet_${i}_col${COL}`),
  ...[0, 1, 2, 3, 4].map(i => `cual_${i}_col${COL}`),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `eq_${i}_col${COL}`),
  ...[0, 1, 2, 3].map(i => `cn_${i}_col${COL}`),
  ...[0, 1, 2, 3].map(i => `int_${i}_col${COL}`),
  ...[0, 1, 2, 3, 4].map(i => `sig_${i}_col${COL}`),
  `diag_matriz_${COL}`, `diag_interp_${COL}`,
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `bioq_${i}_col${COL}`),
  `int_bioq_desc_${COL}`,
  ...[...Array(18).keys()].map(i => `explor_${i}_col${COL}`),
  `interv_ind_col${COL}`,
  ...[0, 1, 2, 3].map(i => `interv_macro_${i}_col${COL}`),
  ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => `interv_eq_${i}_col${COL}`),
  ...[0, 1, 2, 3, 4].map(i => `firma_${i}_col${COL}`),
  `firma_final_col${COL}`,
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const capacidades = await page.evaluate((nombres) => {
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta subsecuente del ciclo de tratamiento '.repeat(15);
    const out = {};
    for (const nombre of nombres) {
      const el = document.querySelector(`[name="${CSS.escape(nombre)}"]`);
      if (!el) { out[nombre] = null; continue; }
      if (el.type === 'checkbox' || el.type === 'number') { out[nombre] = null; continue; }
      const original = el.value;
      const isTextarea = el.tagName === 'TEXTAREA';
      let lo = 0, hi = RELLENO.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2);
        el.value = RELLENO.slice(0, mid);
        const overflow = isTextarea ? el.scrollHeight > el.clientHeight + 1 : el.scrollWidth > el.clientWidth + 1;
        if (overflow) hi = mid - 1; else lo = mid;
      }
      out[nombre] = lo;
      el.value = original;
    }
    return out;
  }, CAMPOS_COL6);

  fs.writeFileSync(path.join(__dirname, 'capacidad_col6.json'), JSON.stringify(capacidades, null, 2));
  console.log('Medidos', Object.keys(capacidades).length, 'campos de la columna 6.');
  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
