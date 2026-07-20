const { chromium, devices } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({ ...iphone });
  const page = await context.newPage();

  // Throttle network via CDP to mimic devtunnel latency
  const client = await context.newCDPSession(page);
  await client.send('Network.enable');
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8, // ~750kbps
    uploadThroughput: (1 * 1024 * 1024) / 8,
    latency: 150, // 400ms RTT
  });

  await page.goto('http://localhost:5173/login', { waitUntil: 'load' });
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 20000 });

  await page.goto('http://localhost:5173/medical-history-viewer/7', { waitUntil: 'load' });

  // Screenshot at multiple early time points to catch a FOUC-style layout bug
  for (const t of [100, 300, 600, 1000, 2000, 3500]) {
    await page.waitForTimeout(t === 100 ? 100 : 200);
    const info = await page.evaluate(() => ({
      innerWidth: window.innerWidth,
      rootWidth: document.getElementById('root')?.getBoundingClientRect().width,
      readyState: document.readyState,
    }));
    console.log(`t~${t}ms:`, JSON.stringify(info));
  }
  await page.screenshot({ path: 'screenshots/repro_throttled.png' });
  await browser.close();
})();
