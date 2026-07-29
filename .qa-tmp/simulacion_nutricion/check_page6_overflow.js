const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1200 } });
  await page.goto('http://localhost:5173/login');
  await page.fill('#email', 'docente.nutricion@edu.utc.mx');
  await page.fill('#password', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.goto('http://localhost:5173/forms/seguimiento-nutricional/78/documento', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const info = await page.evaluate(() => {
    const pc = document.querySelector('.page6 .page-content');
    return {
      scrollHeight: pc.scrollHeight,
      clientHeight: pc.clientHeight,
      overflow: pc.scrollHeight > pc.clientHeight + 1,
    };
  });
  console.log(JSON.stringify(info));
  await browser.close();
})();
