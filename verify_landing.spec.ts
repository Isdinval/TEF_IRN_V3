import { test, expect } from '@playwright/test';

test('landing page visual verification', async ({ page }) => {
  await page.goto('http://localhost:3000/tef-irn');

  // Wait for content to load
  await page.waitForSelector('h1');

  // Check for new pricing
  await expect(page.locator('text=55€/mois')).toBeVisible();

  // Check for merchandising section
  await expect(page.locator('text=La collection LlamaKuzi')).toBeVisible();
  await expect(page.locator('text=Peluche LlamaKuzi 🇫🇷')).toBeVisible();

  // Check for uniform branding
  const content = await page.content();
  expect(content).not.toContain('SpeakFrance');
  expect(content).not.toContain('87%');

  // Take screenshots
  await page.screenshot({ path: 'screenshots/hero.png', fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 3000));
  await page.screenshot({ path: 'screenshots/merchandising.png', fullPage: false });
  await page.evaluate(() => window.scrollTo(0, 5000));
  await page.screenshot({ path: 'screenshots/footer.png', fullPage: false });
});
