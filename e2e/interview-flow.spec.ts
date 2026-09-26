import { test, expect } from '@playwright/test';

test.describe('InterviewIQ End-to-End User Journey', () => {
  test('should render home landing page with CTA elements', async ({ page }) => {
    await page.goto('/');

    // Check brand title and hero headline
    await expect(page.locator('text=InterviewIQ')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Ace Your Next Interview');

    // Verify Get Started link
    const ctaButton = page.locator('a[href="/auth"]').first();
    await expect(ctaButton).toBeVisible();
  });

  test('should allow user signup and redirect to dashboard', async ({ page }) => {
    await page.goto('/auth');

    // Toggle to signup tab if present
    const signupBtn = page.locator('button:has-text("Sign Up")');
    if (await signupBtn.isVisible()) {
      await signupBtn.click();
    }

    const testEmail = `e2e_user_${Date.now()}@example.com`;
    
    // Fill credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'Password123!');
    
    const nameInput = page.locator('input[placeholder*="Name"], input[name="name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('E2E Test User');
    }

    // Submit form
    await page.click('button[type="submit"]');

    // Verify navigation to dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('h1, h2')).toContainText(/Welcome|Dashboard/i);
  });
});
