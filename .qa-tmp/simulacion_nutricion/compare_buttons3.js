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
  await dpage.waitForTimeout(500);
  const closeBtn = await dpage.$('button:has(svg)');
  await dpage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if (b.querySelector('svg') && b.getBoundingClientRect().width < 40) b.click(); });
  });
  await dpage.waitForTimeout(300);
  await dpage.screenshot({ path: 'screenshots/desktop_nutricion_buttons.png', clip: { x: 900, y: 0, width: 500, height: 150 } });

  await dpage.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await dpage.waitForTimeout(500);
  await dpage.evaluate(() => {
    document.querySelectorAll('button').forEach(b => { if (b.querySelector('svg') && b.getBoundingClientRect().width < 40) b.click(); });
  });
  await dpage.waitForTimeout(300);
  await dpage.screenshot({ path: 'screenshots/desktop_seguimiento_buttons.png', clip: { x: 900, y: 0, width: 500, height: 150 } });

  await browser.close();
})();
