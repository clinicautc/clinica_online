const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1400 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'master@edu.utc.mx');
  await page.fill('#password', 'master123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(500);
  await page.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const gineco = await page.locator('text=Antecedentes gineco-obstétricos').first();
  await gineco.scrollIntoViewIfNeeded();
  const box1 = await gineco.boundingBox();
  await page.screenshot({ path: 'screenshots/zoom_gineco.png', clip: { x: Math.max(0,box1.x-20), y: box1.y-10, width: 500, height: 180 } });

  const explor = await page.locator('text=Hallazgos físicos').first();
  await explor.scrollIntoViewIfNeeded();
  const box2 = await explor.boundingBox();
  await page.screenshot({ path: 'screenshots/zoom_exploracion.png', clip: { x: Math.max(0,box2.x-20), y: box2.y-10, width: 420, height: 350 } });

  await browser.close();
})();
