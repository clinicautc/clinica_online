const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const dpage = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await dpage.goto('http://localhost:5173/login');
  await dpage.fill('#email', 'master@edu.utc.mx');
  await dpage.fill('#password', 'master123');
  await dpage.click('button[type="submit"]');
  await dpage.waitForURL('**/dashboard', { timeout: 15000 });

  await dpage.goto('http://localhost:5173/forms/nutricion/72/documento', { waitUntil: 'networkidle' });
  await dpage.waitForTimeout(3500);
  await dpage.screenshot({ path: 'screenshots/desktop_nutricion_buttons.png', clip: { x: 900, y: 0, width: 500, height: 150 } });

  await dpage.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await dpage.waitForTimeout(1500);
  await dpage.screenshot({ path: 'screenshots/desktop_seguimiento_buttons.png', clip: { x: 900, y: 0, width: 500, height: 150 } });

  await browser.close();
})();
