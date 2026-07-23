const { chromium } = require('playwright');

const BASE = 'http://localhost:5173';

const accounts = [
  { rol: 'paciente', email: 'enriquejesusresendiz@hotmail.com', password: 'Paciente1*' },
  { rol: 'admin-nutricion', email: 'docente.nutricion@edu.utc.mx', password: 'admin123' },
  { rol: 'admin-fisio', email: 'docente.fisioterapia@edu.utc.mx', password: 'admin123' },
  { rol: 'master', email: 'master@edu.utc.mx', password: 'master123' },
  { rol: 'practicante-nutricion', email: 'carlos.nutri@edu.utc.mx', password: 'practicante123' },
  { rol: 'practicante-fisio', email: 'maria.fisio@edu.utc.mx', password: 'practicante123' },
];

(async () => {
  const browser = await chromium.launch();
  for (const acc of accounts) {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    try {
      await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
      await page.fill('#email', acc.email);
      await page.fill('input[type="password"]', acc.password);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2500);

      const trigger = page.locator('button', { hasText: 'cerrar sesión' }).first();
      await trigger.waitFor({ state: 'visible', timeout: 10000 });
      await trigger.click();
      await page.waitForTimeout(600);

      const metrics = await page.evaluate(() => {
        const aside = document.querySelector('aside');
        const scrollDiv = aside ? aside.querySelector('.overflow-y-auto') : null;
        if (!scrollDiv) return { error: 'no scrollDiv found' };
        return {
          scrollHeight: scrollDiv.scrollHeight,
          clientHeight: scrollDiv.clientHeight,
          overflowPx: scrollDiv.scrollHeight - scrollDiv.clientHeight,
        };
      });

      console.log(`[${acc.rol}]`, JSON.stringify(metrics));
    } catch (e) {
      console.log(`[${acc.rol}] ERROR: ${e.message}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();
})();
