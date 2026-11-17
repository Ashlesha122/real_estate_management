import { test, expect } from '@playwright/test';

test.describe('EstateFlow Full Startup Flow', () => {
  test('should login as buyer, browse search results, view property detail and interact with features', async ({ page }) => {
    // 1. Visit Login Page and submit credentials
    await page.goto('/login');
    await expect(page.locator('h2:has-text("Welcome Back")')).toBeVisible();

    await page.fill('input[type="email"]', 'buyer@estateflow.com');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button:has-text("Sign In")');

    // Wait for redirect to buyer dashboard
    await page.waitForURL('**/dashboard/buyer');
    await expect(page.locator('h1:has-text("Welcome")')).toBeVisible();

    // 2. Navigate to Search Page
    await page.goto('/search');
    await expect(page.locator('h1')).toBeVisible();

    // Verify property cards load
    const propertyCards = page.locator('article, .group\\/card, [class*="card"]');
    await expect(propertyCards.first()).toBeVisible({ timeout: 10000 });

    // 3. Test filter interaction (e.g. rent vs sale)
    const rentBtn = page.locator('button:has-text("Rent")').first();
    if (await rentBtn.isVisible()) {
      await rentBtn.click();
    }

    // 4. Navigate to a property detail page
    const detailLink = page.locator('a[href^="/properties/"]').first();
    await expect(detailLink).toBeVisible();
    const href = await detailLink.getAttribute('href');
    await detailLink.click();
    await page.waitForURL(`**${href}`);

    // Verify property detail view elements
    await expect(page.locator('h1').first()).toBeVisible();
    await expect(page.locator('text=Property Details').first()).toBeVisible();

    // 5. Test Book Visit Modal (User is authenticated, so modal opens!)
    const bookVisitBtn = page.locator('button:has-text("Schedule Site Visit")').first();
    await expect(bookVisitBtn).toBeVisible();
    await bookVisitBtn.click();
    await expect(page.locator('h3:has-text("Schedule Site Visit")')).toBeVisible();

    // Close modal
    const closeBtn = page.locator('button[class*="absolute top-4"]').first();
    await closeBtn.click();
  });
});
