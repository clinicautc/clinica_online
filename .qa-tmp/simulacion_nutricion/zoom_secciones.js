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

  // Sintomatologia (pagina 1)
  const sintomas = await page.$('text=Sintomatología');
  if (sintomas) { const box = await sintomas.boundingBox(); await page.screenshot({ path: 'screenshots/zoom_sintomas.png', clip: { x: Math.max(0,box.x-20), y: box.y-10, width: 500, height: 350 } }); }

  await browser.close();
})();
