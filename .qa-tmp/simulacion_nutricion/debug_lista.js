const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
  page.on('console', (msg) => console.log('CONSOLE', msg.type().toUpperCase(), msg.text()));
  page.on('requestfailed', (req) => console.log('REQ FAILED', req.url(), req.failure()?.errorText));
  page.on('response', (res) => {
    if (res.url().includes('/api/')) console.log('RESP', res.status(), res.url());
  });

  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1500);

  console.log('--- navegando a medical-history-viewer/7 ---');
  await page.goto('http://localhost:5173/medical-history-viewer/7');
  await page.waitForTimeout(6000);
  console.log('--- fin de espera ---');

  await browser.close();
})().catch((e) => { console.error('FALLO:', e); process.exit(1); });
