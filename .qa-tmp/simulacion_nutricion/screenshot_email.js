const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 680, height: 800 } });
  await page.goto('file:///C:/Users/thega/AppData/Local/Temp/claude/C--Users-thega-Documents-Projects-clinica-online/7eba86f8-f937-405c-b022-85a94c274ca3/scratchpad/preview_email.html');
  await page.screenshot({ path: __dirname + '/screenshots/11_email_footer.png', fullPage: true });
  await browser.close();
})();
