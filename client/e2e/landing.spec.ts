import { test, expect } from '@playwright/test';

test.describe('EstateFlow Landing & Navigation', () => {
  test('should load the homepage with hero search and stats', async ({ page }) => {
    await page.goto('/');

    // Check title and brand
    await expect(page).toHaveTitle(/EstateFlow/i);
    await expect(page.locator('text=EstateFlow').first()).toBeVisible();

    // Check Hero text
    await expect(page.locator('text=Zero Hassle & Zero Brokerage')).toBeVisible();

    // Check Search Box
    const searchInput = page.locator('input[placeholder*="Enter City"]');
    await expect(searchInput).toBeVisible();

    // Check Zero Brokerage button
    await expect(page.locator('text=Zero Brokerage Only').first()).toBeVisible();
  });

  test('should navigate to search page when search button is clicked', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Search")');
    await expect(page).toHaveURL(/.*search/);
  });
});
