const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(500);

  await page.goto('http://localhost:5173/medical-history-viewer/7', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  async function measure(label) {
    const info = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        innerWidth: window.innerWidth,
        docElClientWidth: document.documentElement.clientWidth,
        rootWidth: root ? root.getBoundingClientRect().width : null,
        rootScrollWidth: root ? root.scrollWidth : null,
        bodyScrollWidth: document.body.scrollWidth,
      };
    });
    console.log(label, JSON.stringify(info));
  }

  await measure('after initial goto (fresh load)');

  // Simular "recarga dura" (F5) real
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await measure('after page.reload() (F5)');

  await page.screenshot({ path: 'screenshots/repro_reload_bug.png' });

  await browser.close();
})();
