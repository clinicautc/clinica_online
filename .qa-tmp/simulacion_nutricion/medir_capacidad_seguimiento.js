const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);

  // cita 78 -> documento con las 6 columnas ya llenas
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const resultado = await page.evaluate(() => {
    // Texto de relleno realista en español (prosa clínica típica), se corta a la
    // longitud que se esté probando en cada iteración del binary search.
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta '.repeat(30);

    const campos = Array.from(document.querySelectorAll('input[name], textarea[name]'));

    function firma(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return [
        el.tagName,
        Math.round(r.width), Math.round(r.height),
        cs.fontSize, cs.fontFamily, cs.fontWeight,
        cs.paddingLeft, cs.paddingRight, cs.paddingTop, cs.paddingBottom,
        cs.lineHeight, cs.textAlign
      ].join('|');
    }

    // Agrupar por firma visual idéntica (mismo tamaño/fuente/padding = misma capacidad)
    const grupos = new Map();
    for (const el of campos) {
      if (el.offsetParent === null) continue; // oculto, no medible
      const f = firma(el);
      if (!grupos.has(f)) grupos.set(f, []);
      grupos.get(f).push(el.name);
    }

    const filas = [];
    for (const [f, nombres] of grupos.entries()) {
      const repName = nombres[0];
      const el = document.querySelector(`[name="${CSS.escape(repName)}"]`);
      const original = el.value;
      const isTextarea = el.tagName === 'TEXTAREA';

      // Binary search del máximo de caracteres sin overflow
      let lo = 0, hi = RELLENO.length;
      while (lo < hi) {
        const mid = Math.ceil((lo + hi + 1) / 2);
        el.value = RELLENO.slice(0, mid);
        const overflow = isTextarea
          ? el.scrollHeight > el.clientHeight + 1
          : el.scrollWidth > el.clientWidth + 1;
        if (overflow) hi = mid - 1; else lo = mid;
      }
      const maxChars = lo;
      el.value = original;

      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      filas.push({
        tipo: el.tagName.toLowerCase(),
        camposDeEsteGrupo: nombres.length,
        ejemplo: repName,
        otrosEjemplos: nombres.slice(1, 4),
        anchoPx: Math.round(r.width),
        altoPx: Math.round(r.height),
        fontSize: cs.fontSize,
        maxCaracteres: maxChars,
      });
    }

    filas.sort((a, b) => a.maxCaracteres - b.maxCaracteres);
    return filas;
  });

  const outPath = path.join(__dirname, 'capacidad_campos_seguimiento.json');
  fs.writeFileSync(outPath, JSON.stringify(resultado, null, 2));
  console.log('Grupos de campos distintos encontrados:', resultado.length);
  console.log('');
  resultado.forEach(f => {
    console.log(
      `${f.tipo.padEnd(9)} max=${String(f.maxCaracteres).padStart(4)} chars | ${f.anchoPx}x${f.altoPx}px @ ${f.fontSize} | x${f.camposDeEsteGrupo} campos | ej: ${f.ejemplo}` +
      (f.otrosEjemplos.length ? ` (+${f.otrosEjemplos.join(', ')}${f.camposDeEsteGrupo > 4 ? ', ...' : ''})` : '')
    );
  });

  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
