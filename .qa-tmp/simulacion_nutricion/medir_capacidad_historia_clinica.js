const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(800);

  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const resultado = await page.evaluate(() => {
    const RELLENO = 'el paciente presenta una evolucion favorable con mejoria notable en los habitos alimenticios y en la actividad fisica registrada durante las ultimas semanas de seguimiento nutricional segun lo reportado en cada consulta '.repeat(30);

    const campos = Array.from(document.querySelectorAll('.p1-paper input[name], .p1-paper textarea[name]'))
      .concat(Array.from(document.querySelectorAll('.p1-paper input:not([name])[type="text"], .p1-paper textarea:not([name])')));
    // fallback: si no usan name, tomar por posicion via un identificador sintetico
    const todos = Array.from(document.querySelectorAll('.p1-paper input, .p1-paper textarea')).filter(el => el.type !== 'checkbox');

    function firma(el) {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return [
        el.tagName,
        Math.round(r.width), Math.round(r.height),
        cs.fontSize, cs.fontWeight,
        cs.paddingLeft, cs.paddingRight, cs.paddingTop, cs.paddingBottom,
        cs.lineHeight, cs.textAlign
      ].join('|');
    }

    const grupos = new Map();
    let idx = 0;
    for (const el of todos) {
      if (el.offsetParent === null) continue;
      const f = firma(el);
      if (!grupos.has(f)) grupos.set(f, []);
      grupos.get(f).push({ el, idx: idx++ });
    }

    const filas = [];
    for (const [f, items] of grupos.entries()) {
      const { el } = items[0];
      const original = el.value;
      const isTextarea = el.tagName === 'TEXTAREA';

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
        name: el.getAttribute('name') || '(sin name)',
        camposDeEsteGrupo: items.length,
        anchoPx: Math.round(r.width),
        altoPx: Math.round(r.height),
        fontSize: cs.fontSize,
        maxCaracteres: maxChars,
      });
    }

    filas.sort((a, b) => a.maxCaracteres - b.maxCaracteres);
    return filas;
  });

  const outPath = path.join(__dirname, 'capacidad_historia_clinica.json');
  fs.writeFileSync(outPath, JSON.stringify(resultado, null, 2));
  console.log('Grupos de campos distintos encontrados:', resultado.length);
  console.log('');
  resultado.forEach(f => {
    console.log(
      `${f.tipo.padEnd(9)} max=${String(f.maxCaracteres).padStart(4)} chars | ${f.anchoPx}x${f.altoPx}px @ ${f.fontSize} | x${f.camposDeEsteGrupo} campos | ej: ${f.name}`
    );
  });

  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
