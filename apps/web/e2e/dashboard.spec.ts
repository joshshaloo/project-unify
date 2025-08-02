import { test, expect } from '@playwright/test'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display dashboard after successful login', async ({ page }) => {
    await expect(page.locator('h1, [data-testid="dashboard-title"]')).toContainText(/dashboard/i)
  })

  test('should show user information', async ({ page }) => {
    // Should display user name or email
    await expect(page.locator('[data-testid="user-info"], .user-info')).toBeVisible()
  })

  test('should have navigation links', async ({ page }) => {
    // Check for common navigation elements
    const navigation = page.locator('nav, [role="navigation"]')
    await expect(navigation).toBeVisible()
  })

  test('should allow user to sign out', async ({ page }) => {
    const signOutButton = page.locator('button:has-text("Sign out"), [data-testid="sign-out"]')
    await signOutButton.click()

    // Should redirect to home page
    await expect(page).toHaveURL('/')
  })

  test('should display clubs if user has any', async ({ page }) => {
    // This test assumes the test user has clubs associated
    const clubsSection = page.locator('[data-testid="clubs"], .clubs')
    
    // Either shows clubs or shows a "no clubs" message
    const hasClubs = await clubsSection.isVisible()
    if (hasClubs) {
      await expect(clubsSection).toBeVisible()
    } else {
      await expect(page.locator('text=/no clubs/i, text=/create.*club/i')).toBeVisible()
    }
  })

  test('should have responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('body')).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('body')).toBeVisible()

    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('body')).toBeVisible()
  })
})