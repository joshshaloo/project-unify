import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

test.describe('Complete User Workflows', () => {
  test.describe('New User Onboarding', () => {
    test('should complete full signup and onboarding flow', async ({ page }) => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'SecurePassword123!',
        clubName: `${faker.word.adjective()} ${faker.word.noun()} FC`
      }

      // 1. Start at home page
      await page.goto('/')
      
      // 2. Navigate to signup
      await page.click('text=Sign up')
      await expect(page).toHaveURL('/auth/signup')

      // 3. Complete signup form
      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.check('input[name="agree"]')
      await page.click('button[type="submit"]')

      // 4. Should go to email verification
      await expect(page).toHaveURL('/auth/verify-email')

      // For testing purposes, we'll simulate email verification by directly navigating
      // In a real scenario, this would involve clicking a link from an email
      
      // 5. Simulate login after email verification
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.click('button[type="submit"]')

      // 6. Should redirect to dashboard or onboarding
      await expect(page).toHaveURL(/\/(dashboard|onboarding)/)

      // 7. If onboarding is required, complete it
      const currentUrl = page.url()
      if (currentUrl.includes('onboarding')) {
        // Complete onboarding process
        await page.selectOption('select[name="role"]', 'head_coach')
        await page.fill('input[name="clubName"]', userData.clubName)
        await page.click('button[type="submit"]')
        
        // Should now go to dashboard
        await expect(page).toHaveURL('/dashboard')
      }

      // 8. Verify user is successfully logged in and can access dashboard
      await expect(page.locator('text=Dashboard, text=Welcome')).toBeVisible()
    })

    test('should handle invitation-based signup flow', async ({ page }) => {
      const inviteToken = 'valid-invite-token'
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'SecurePassword123!'
      }

      // 1. Start with invitation link
      await page.goto(`/auth/signup?invite=${inviteToken}`)

      // 2. Should show invitation info
      await expect(page.locator('text=invited, text=join')).toBeVisible()

      // 3. Complete signup with invitation
      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.check('input[name="agree"]')
      await page.click('button[type="submit"]')

      // 4. Should go to email verification
      await expect(page).toHaveURL('/auth/verify-email')

      // 5. After verification and login, user should be part of the club
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')
      
      // Should show club information
      await expect(page.locator('[data-testid="user-clubs"], .clubs')).toBeVisible()
    })
  })

  test.describe('User Session Management', () => {
    test('should maintain session across browser refresh', async ({ page }) => {
      // 1. Login
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard')

      // 2. Refresh the page
      await page.reload()

      // 3. Should still be logged in
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('text=Dashboard')).toBeVisible()
    })

    test('should handle session expiration', async ({ page, context }) => {
      // 1. Login
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard')

      // 2. Clear cookies to simulate session expiration
      await context.clearCookies()

      // 3. Try to navigate to a protected page
      await page.goto('/dashboard')

      // 4. Should redirect to login
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should logout and clear session', async ({ page }) => {
      // 1. Login
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL('/dashboard')

      // 2. Sign out
      await page.click('button:has-text("Sign out"), [data-testid="sign-out"]')
      await expect(page).toHaveURL('/')

      // 3. Try to access protected page
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('Error Recovery', () => {
    test('should recover from network errors during login', async ({ page }) => {
      await page.goto('/auth/login')

      // Simulate network failure by going offline
      await page.context().setOffline(true)

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      // Should show some indication of failure (or just not proceed)
      await expect(page).toHaveURL('/auth/login')

      // Go back online and retry
      await page.context().setOffline(false)
      await page.click('button[type="submit"]')

      // Should now succeed
      await expect(page).toHaveURL('/dashboard')
    })

    test('should handle browser back/forward during auth flow', async ({ page }) => {
      // 1. Start at home
      await page.goto('/')

      // 2. Go to login
      await page.goto('/auth/login')

      // 3. Go to signup
      await page.goto('/auth/signup')

      // 4. Go back to login
      await page.goBack()
      await expect(page).toHaveURL('/auth/login')

      // 5. Form should still work
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      await expect(page).toHaveURL('/dashboard')
    })
  })

  test.describe('Mobile User Experience', () => {
    test('should work on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Test mobile signup flow
      await page.goto('/auth/signup')

      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'SecurePassword123!'
      }

      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.check('input[name="agree"]')

      // Form should be usable on mobile
      const submitButton = page.locator('button[type="submit"]')
      await expect(submitButton).toBeVisible()
      await submitButton.click()

      await expect(page).toHaveURL('/auth/verify-email')
    })

    test('should have touch-friendly elements', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/auth/login')

      // Check that buttons and form elements are large enough for touch
      const submitButton = page.locator('button[type="submit"]')
      const buttonBox = await submitButton.boundingBox()
      
      expect(buttonBox?.height).toBeGreaterThan(44) // Minimum touch target size
    })
  })

  test.describe('Accessibility Workflows', () => {
    test('should be navigable with keyboard only', async ({ page }) => {
      await page.goto('/auth/login')

      // Navigate using tab key
      await page.keyboard.press('Tab') // Email field
      await page.keyboard.type('test@example.com')
      
      await page.keyboard.press('Tab') // Password field
      await page.keyboard.type('password123')
      
      await page.keyboard.press('Tab') // Remember me
      await page.keyboard.press('Tab') // Forgot password link
      await page.keyboard.press('Tab') // Submit button
      await page.keyboard.press('Enter')

      await expect(page).toHaveURL('/dashboard')
    })

    test('should work with screen reader simulation', async ({ page }) => {
      await page.goto('/auth/login')

      // Check for proper ARIA labels and roles
      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')

      await expect(emailInput).toHaveAttribute('id', 'email')
      await expect(passwordInput).toHaveAttribute('id', 'password')

      // Check for associated labels
      await expect(page.locator('label[for="email"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
    })
  })

  test.describe('Performance Testing', () => {
    test('should load auth pages quickly', async ({ page }) => {
      const startTime = Date.now()
      await page.goto('/auth/login')
      await page.waitForLoadState('networkidle')
      const endTime = Date.now()

      expect(endTime - startTime).toBeLessThan(3000) // Should load in less than 3 seconds
    })

    test('should handle form submission without blocking UI', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')

      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // UI should show loading state
      await expect(submitButton).toBeDisabled()
      await expect(submitButton).toContainText(/signing in/i)
    })
  })
})