import { test, expect } from '@playwright/test';

test('verify lessons list page', async ({ page }) => {
  await page.goto('http://localhost:3000/lessons');
  await page.waitForTimeout(2000); // Wait for animations/rendering
  await page.screenshot({ path: 'lessons-list.png', fullPage: true });
});

test('verify parcours detail page', async ({ page }) => {
  // We need a valid parcours ID, let's try a dummy one or mock the response
  // Since we don't have real data easily, we'll just check if it renders anything
  await page.goto('http://localhost:3000/parcours/dummy-id');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'parcours-detail.png', fullPage: true });
});
