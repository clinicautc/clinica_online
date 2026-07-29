const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 1200 } });
  const page = await ctx.newPage();
  page.on('response', async res => {
    if (res.url().includes('/api/horarios')) {
      let body = null;
      try { body = await res.json(); } catch {}
      console.log('RESPONSE', res.request().method(), res.status(), res.url(), JSON.stringify(body));
    }
  });
  page.on('request', req => {
    if (req.url().includes('/api/horarios') && req.method() === 'PUT') {
      console.log('REQUEST BODY:', req.postData());
    }
  });

  await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'master@edu.utc.mx');
  await page.fill('input[type="password"]', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  await page.goto('http://localhost:5173/administrar-personal', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  const row = page.locator('tr', { hasText: 'Maria Fisio' }).first();
  await row.scrollIntoViewIfNeeded();
  await row.locator('button:has-text("Horario")').click({ force: true });
  await page.waitForTimeout(1500);

  await page.screenshot({ path: __dirname + '/screenshots/horario_editor.png' });
  const info = await page.evaluate(() => document.body.innerText);
  console.log('---BODY TEXT SNIPPET---');
  console.log(info.slice(0, 2000));

  await browser.close();
})();
