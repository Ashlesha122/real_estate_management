import { test, expect } from '@playwright/test';

test.describe('EstateFlow Authentication Flow', () => {
  test('should display login form with required fields', async ({ page }) => {
    await page.goto('/login');

    await expect(page.locator('h2:has-text("Welcome Back")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should display registration form with role selector', async ({ page }) => {
    await page.goto('/register');

    await expect(page.locator('h2:has-text("Create an Account")')).toBeVisible();
    await expect(page.locator('text=Buyer / Tenant')).toBeVisible();
    await expect(page.locator('text=Property Owner')).toBeVisible();
    await expect(page.locator('text=Licensed Broker')).toBeVisible();

    await expect(page.locator('input[placeholder*="Rahul Sharma"]')).toBeVisible();
    await expect(page.locator('button:has-text("Register Now")')).toBeVisible();
  });
});
