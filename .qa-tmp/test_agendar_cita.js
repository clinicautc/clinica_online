const { chromium } = require('playwright');
const path = require('path');
const fs   = require('fs');
const http = require('http');

const SS = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SS)) fs.mkdirSync(SS);

function apiCall(opts, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const headers = { ...opts.headers };
    if (data) headers['Content-Length'] = Buffer.byteLength(data);
    const req = http.request({ hostname: 'localhost', port: 3001, ...opts, headers }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(buf) }));
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  // timezoneId: 'UTC' evita que isToday() en el frontend evalúe medianoche UTC
  // como "ayer" en zonas UTC-N (bug de timezone en la app — workaround solo para la prueba).
  const ctx  = await browser.newContext({ timezoneId: 'UTC', viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // ── 1. Login ─────────────────────────────────────────────────────────────
  console.log('\n=== Prueba en vivo: Agendar cita con asignación automática ===\n');
  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]',    'laura.hernandez@test.com');
  await page.fill('input[type="password"]', 'paciente123');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 12000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(SS, 'cita-01-dashboard.png') });
  console.log('01 - Dashboard paciente cargado (pestaña activa: Mis Citas)');

  // ── 2. Clic en la pestaña "Agendar Cita" ─────────────────────────────────
  // El defaultValue del Tabs es "schedule" (Mis Citas); hay que activar "appointments"
  const tabAgendar = page.locator('[role="tab"]').filter({ hasText: /agendar cita/i }).first();
  await tabAgendar.waitFor({ timeout: 8000 });
  await tabAgendar.click();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SS, 'cita-02-tab-agendar.png') });
  console.log('02 - Pestaña "Agendar Cita" activada');

  // ── 3. Seleccionar "Nutrición" en el Select de tipo servicio ─────────────
  // Shadcn SelectTrigger tiene role="combobox" via Radix; ahora ya está montado
  const selectTrigger = page.locator('[role="combobox"]').first();
  await selectTrigger.waitFor({ timeout: 8000 });
  await selectTrigger.click();
  await page.waitForTimeout(400);

  const opNutricion = page.locator('[role="option"]').filter({ hasText: /nutrici/i }).first();
  await opNutricion.waitFor({ timeout: 5000 });
  await opNutricion.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SS, 'cita-03-servicio.png') });
  console.log('03 - Área "Nutrición" seleccionada');

  // ── 4. Avanzar al mes siguiente (julio) y seleccionar July 3 (jueves)
  // Evita el bug de timezone: react-day-picker devuelve UTC midnight, y en
  // zonas UTC-N eso es el día anterior, haciendo que "mañana" sea "hoy".
  // Julio 3 está suficientemente lejos para que no haya ambigüedad.
  const navNext = page.locator('button.absolute.right-1').first();
  await navNext.waitFor({ timeout: 5000 });
  await navNext.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SS, 'cita-04a-julio.png') });
  console.log('04a - Calendario avanzado a julio 2026');

  // Seleccionar July 3 (jueves) — primer día disponible no-fin-de-semana
  const clicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('table button[type="button"]'));
    // Buscar el botón con texto "3" (July 3, jueves) que no esté disabled
    const btn3 = buttons.find(b =>
      b.textContent?.trim() === '3' &&
      !b.disabled &&
      b.getAttribute('aria-disabled') !== 'true' &&
      !b.classList.contains('rdp-day_disabled')
    );
    if (btn3) { btn3.click(); return btn3.textContent?.trim(); }
    // fallback: primer botón habilitado en la tabla
    const fallback = buttons.find(b =>
      !b.disabled &&
      b.getAttribute('aria-disabled') !== 'true' &&
      !b.classList.contains('rdp-day_disabled')
    );
    if (fallback) { fallback.click(); return fallback.textContent?.trim(); }
    return null;
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SS, 'cita-04-fecha.png') });
  console.log(`04 - Fecha seleccionada: julio ${clicked}`);

  // ── 5. Esperar slots y seleccionar el primero disponible ─────────────────
  // Primero esperamos a que el contenedor de slots aparezca en el DOM
  try {
    await page.waitForFunction(() => {
      const btns = Array.from(document.querySelectorAll('button[type="button"]'));
      return btns.some(b => /^\d{2}:\d{2}$/.test(b.textContent?.trim() ?? ''));
    }, { timeout: 6000 });
  } catch (e) {
    // Debug: ver qué hay en el DOM si no aparecen los slots
    const debug = await page.evaluate(() => {
      const allBtns = Array.from(document.querySelectorAll('button[type="button"]'));
      const hhmmBtns = allBtns.filter(b => /^\d{2}:\d{2}$/.test(b.textContent?.trim() ?? ''));
      return {
        totalButtons: allBtns.length,
        hhmmButtons: hhmmBtns.length,
        slotContainerExists: !!document.querySelector('div.max-h-48'),
        dateSelected: !!document.querySelector('[aria-selected="true"]'),
        firstButtons: allBtns.slice(0, 5).map(b => b.textContent?.trim()),
      };
    });
    console.log('  ⚠️  Slots no aparecieron en 6s. DEBUG:', JSON.stringify(debug, null, 2));
    await page.screenshot({ path: path.join(SS, 'cita-05-debug.png') });
    await browser.close();
    return;
  }

  await page.waitForTimeout(600); // pequeña espera extra para que el fetch de disponibilidad complete

  const primerSlot = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button[type="button"]'));
    const slot = btns.find(b =>
      /^\d{2}:\d{2}$/.test(b.textContent?.trim() ?? '') &&
      !b.disabled &&
      b.getAttribute('aria-disabled') !== 'true'
    );
    if (slot) { slot.click(); return slot.textContent?.trim(); }
    // debug: cuántos botones HH:MM existen pero están disabled
    const allHhmm = btns.filter(b => /^\d{2}:\d{2}$/.test(b.textContent?.trim() ?? ''));
    return `DEBUG_TODOS_DISABLED:${allHhmm.length}`;
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SS, 'cita-05-hora.png') });

  if (!primerSlot || primerSlot.startsWith('DEBUG_')) {
    console.log(`  ⚠️  Sin slots habilitados. ${primerSlot}`);
    await browser.close();
    return;
  }
  console.log(`05 - Hora seleccionada: ${primerSlot}`);

  // ── 6. Confirmar la cita ──────────────────────────────────────────────────
  const habilitado = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button[type="submit"]'))
      .find(b => /confirmar/i.test(b.textContent ?? ''));
    return btn ? !btn.disabled : false;
  });

  if (!habilitado) {
    console.log('  ⚠️  Botón "Confirmar" deshabilitado — falta tipo/fecha/hora');
    await page.screenshot({ path: path.join(SS, 'cita-06-error.png') });
    await browser.close();
    return;
  }

  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button[type="submit"]'))
      .find(b => /confirmar/i.test(b.textContent ?? ''));
    btn?.click();
  });
  console.log('06 - Click en "Confirmar Cita"...');
  await page.waitForTimeout(3500);
  await page.screenshot({ path: path.join(SS, 'cita-07-resultado.png') });

  // ── 7. Capturar texto del toast ───────────────────────────────────────────
  const toastTexts = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-sonner-toast]');
    return Array.from(els).map(e => e.textContent?.trim());
  });
  if (toastTexts.length > 0) {
    console.log(`\n✅ TOAST: "${toastTexts.join(' | ')}"`);
  } else {
    console.log('\n⚠️  Toast no capturado (puede que ya haya desaparecido)');
  }

  // ── 8. Verificar en la API la última cita creada ──────────────────────────
  const login = await apiCall(
    { path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'laura.hernandez@test.com', password: 'paciente123' }
  );
  const token     = login.body.accessToken;
  const pacienteId = login.body.id;

  const citas = await apiCall({
    path:    `/api/citas/paciente/${pacienteId}`,
    method:  'GET',
    headers: { Authorization: `Bearer ${token}` }
  });

  const ultima = Array.isArray(citas.body) ? citas.body[0] : null;
  console.log('\n── Última cita en DB ──');
  if (ultima) {
    console.log(`  id:                 ${ultima.id}`);
    console.log(`  tipo:               ${ultima.tipo}`);
    console.log(`  fecha:              ${String(ultima.fecha).substring(0, 10)}`);
    console.log(`  hora:               ${ultima.hora}`);
    console.log(`  estado:             ${ultima.estado}`);
    console.log(`  practicante_nombre: ${ultima.practicante_nombre ?? '—'}`);
    console.log(`  practicante_id:     ${ultima.practicante_id ?? '—'}`);

    if (ultima.practicante_nombre) {
      console.log('\n✅ ASIGNACIÓN AUTOMÁTICA CONFIRMADA — practicante asignado al crear la cita.');
    } else if (ultima.estado === 'pendiente_reprogramacion') {
      console.log('\n⚠️  Sin practicante disponible → estado = pendiente_reprogramacion');
    } else {
      console.log('\n⚠️  Cita creada pero sin practicante asignado.');
    }
  } else {
    console.log('  No se encontraron citas para este paciente.');
  }

  await browser.close();
  console.log('\nScreenshots en .qa-tmp/screenshots/\n');
})().catch(err => { console.error('\nERROR:', err.message); process.exit(1); });
