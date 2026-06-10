const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to /writing...');
  try {
    // Note: Since there is a middleware redirecting to /login,
    // and we don't have an easy way to login in this environment,
    // we might need to mock the session or bypass it if possible.
    // However, I can try to go directly to /writing and see if it loads (sometimes dev env has different behavior or I can bypass)
    await page.goto('http://localhost:3000/writing', { waitUntil: 'networkidle', timeout: 60000 });

    // If redirected to login, take a screenshot of login to see if it works at least
    if (page.url().includes('/login')) {
       console.log('Redirected to login. Taking screenshot of login page.');
       await page.screenshot({ path: 'login_page.png' });
    } else {
       console.log('Loaded writing page. Taking screenshots...');
       await page.screenshot({ path: 'writing_page_full.png' });

       // Check for specific elements
       const timer = await page.locator('text=Chronomètre TEF').isVisible();
       console.log('Timer visible:', timer);

       const redactionZone = await page.locator('text=Zone de rédaction').isVisible();
       console.log('Redaction zone visible:', redactionZone);
    }

  } catch (error) {
    console.error('Error during verification:', error);
  }

  await browser.close();
})();
