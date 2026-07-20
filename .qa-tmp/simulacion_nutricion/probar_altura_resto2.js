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

  const TABLAS = [
    { nombre: 'sig', prefijoCampo: 'sig_', sufijoCampo: '_col1', pageClass: 'page4' },
    { nombre: 'explor', prefijoCampo: 'explor_', sufijoCampo: '_col1', pageClass: 'page5' },
    { nombre: 'firma', prefijoCampo: 'firma_', sufijoCampo: '_col1', pageClass: 'page6' },
    { nombre: 'interv_ind', campoUnico: 'interv_ind_col1', pageClass: 'page6' },
  ];

  const resultado = await page.evaluate((tablas) => {
    function alturaPagina(pageClass) { return document.querySelector('.' + pageClass).getBoundingClientRect().height; }

    const salida = {};
    for (const cfg of tablas) {
      let campos;
      if (cfg.campoUnico) {
        campos = [document.querySelector(`[name="${cfg.campoUnico}"]`)];
      } else {
        campos = Array.from(document.querySelectorAll(`[name^="${cfg.prefijoCampo}"][name$="${cfg.sufijoCampo}"]`))
          .filter(el => !el.name.includes('fecha'));
      }
      const alturaOriginal = campos[0].getBoundingClientRect().height;
      const alturaInicialPagina = alturaPagina(cfg.pageClass);

      let lo = Math.round(alturaOriginal), hi = 400, mejor = Math.round(alturaOriginal);
      while (lo <= hi) {
        const h = Math.floor((lo + hi) / 2);
        campos.forEach(el => { el.style.height = h + 'px'; el.closest('td').style.height = h + 'px'; });
        const alturaNueva = alturaPagina(cfg.pageClass);
        if (alturaNueva <= alturaInicialPagina + 0.5) { mejor = h; lo = h + 1; } else { hi = h - 1; }
      }
      campos.forEach(el => { el.style.height = mejor + 'px'; el.closest('td').style.height = mejor + 'px'; });

      salida[cfg.nombre] = { alturaOriginal: Math.round(alturaOriginal), alturaSeguraMax: mejor, alturaPaginaFinal: alturaPagina(cfg.pageClass) };
    }
    return salida;
  }, TABLAS);

  console.log(JSON.stringify(resultado, null, 2));
  await browser.close();
})().catch(e => { console.error('FALLO:', e); process.exit(1); });
