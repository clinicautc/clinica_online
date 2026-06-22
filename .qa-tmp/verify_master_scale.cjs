const { chromium } = require('playwright');
const path = require('path');
const SCREEN_DIR = path.join(__dirname, 'screens');
const BASE = 'http://localhost:5173';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(1000);

  await page.getByRole('tab', { name: /Personal Académico/i }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(SCREEN_DIR, 'master-personal-scaled.png'), fullPage: true });
  console.log('Errors:', errors);
  await browser.close();
})();
