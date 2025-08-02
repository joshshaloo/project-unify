import { test, expect } from '@playwright/test'
import { faker } from '@faker-js/faker'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page before each test
    await page.goto('/')
  })

  test.describe('User Registration', () => {
    test('should successfully register a new user', async ({ page }) => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'SecurePassword123!',
      }

      // Navigate to signup page
      await page.click('text=Sign up')
      await expect(page).toHaveURL('/auth/signup')

      // Fill out the signup form
      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.check('input[name="agree"]')

      // Submit the form
      await page.click('button[type="submit"]')

      // Should redirect to verify email page
      await expect(page).toHaveURL('/auth/verify-email')
      await expect(page.locator('text=Check your email')).toBeVisible()
    })

    test('should show error for duplicate email registration', async ({ page }) => {
      const existingEmail = 'existing@example.com'

      await page.goto('/auth/signup')

      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', existingEmail)
      await page.fill('input[name="password"]', 'password123')
      await page.check('input[name="agree"]')

      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('[role="alert"], .text-red-800')).toContainText(/already/i)
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/signup')

      // Try to submit without filling fields
      await page.click('button[type="submit"]')

      // Check HTML5 validation
      const nameInput = page.locator('input[name="name"]')
      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')
      const agreeCheckbox = page.locator('input[name="agree"]')

      await expect(nameInput).toHaveAttribute('required')
      await expect(emailInput).toHaveAttribute('required')
      await expect(passwordInput).toHaveAttribute('required')
      await expect(agreeCheckbox).toHaveAttribute('required')
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="password"]', 'password123')
      await page.check('input[name="agree"]')

      await page.click('button[type="submit"]')

      // Should not proceed due to HTML5 email validation
      await expect(page).toHaveURL('/auth/signup')
    })

    test('should require terms agreement', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      // Don't check the agreement checkbox

      await page.click('button[type="submit"]')

      // Should not proceed due to required checkbox
      await expect(page).toHaveURL('/auth/signup')
    })
  })

  test.describe('User Login', () => {
    test('should successfully login with valid credentials', async ({ page }) => {
      // For this test, we assume there's a test user in the database
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      }

      await page.goto('/auth/login')

      await page.fill('input[name="email"]', credentials.email)
      await page.fill('input[name="password"]', credentials.password)

      await page.click('button[type="submit"]')

      // Should redirect to dashboard after successful login
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('text=Dashboard')).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('input[name="email"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')

      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('.text-red-800')).toContainText(/invalid/i)
      await expect(page).toHaveURL('/auth/login')
    })

    test('should validate required fields', async ({ page }) => {
      await page.goto('/auth/login')

      // Try to submit without filling fields
      await page.click('button[type="submit"]')

      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')

      await expect(emailInput).toHaveAttribute('required')
      await expect(passwordInput).toHaveAttribute('required')
    })

    test('should validate email format', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('input[name="email"]', 'invalid-email')
      await page.fill('input[name="password"]', 'password123')

      await page.click('button[type="submit"]')

      // Should not proceed due to HTML5 email validation
      await expect(page).toHaveURL('/auth/login')
    })

    test('should remember me checkbox work', async ({ page }) => {
      await page.goto('/auth/login')

      const rememberCheckbox = page.locator('input[name="remember-me"]')
      
      // Initially unchecked
      await expect(rememberCheckbox).not.toBeChecked()

      // Can be checked
      await rememberCheckbox.check()
      await expect(rememberCheckbox).toBeChecked()

      // Can be unchecked
      await rememberCheckbox.uncheck()
      await expect(rememberCheckbox).not.toBeChecked()
    })
  })

  test.describe('Invitation-based Registration', () => {
    test('should register with valid invitation token', async ({ page }) => {
      // This test would need a valid invitation token
      const inviteToken = 'valid-invite-token-123'
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'SecurePassword123!',
      }

      await page.goto(`/auth/signup?invite=${inviteToken}`)

      // Form should be pre-filled with invitation info
      await expect(page.locator('text=You have been invited')).toBeVisible()

      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.check('input[name="agree"]')

      await page.click('button[type="submit"]')

      // Should redirect to verify email page
      await expect(page).toHaveURL('/auth/verify-email')
    })

    test('should show error for invalid invitation token', async ({ page }) => {
      const invalidToken = 'invalid-token-123'
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'SecurePassword123!',
      }

      await page.goto(`/auth/signup?invite=${invalidToken}`)

      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.check('input[name="agree"]')

      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('.text-red-800')).toContainText(/invalid invitation/i)
    })

    test('should show error for expired invitation', async ({ page }) => {
      const expiredToken = 'expired-token-123'
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'SecurePassword123!',
      }

      await page.goto(`/auth/signup?invite=${expiredToken}`)

      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.fill('input[name="password"]', userData.password)
      await page.check('input[name="agree"]')

      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('.text-red-800')).toContainText(/expired/i)
    })
  })

  test.describe('Sign Out', () => {
    test('should successfully sign out user', async ({ page }) => {
      // First, log in a user
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      // Wait for redirect to dashboard
      await expect(page).toHaveURL('/dashboard')

      // Find and click sign out button
      await page.click('button:has-text("Sign out"), [data-testid="sign-out"]')

      // Should redirect to home page
      await expect(page).toHaveURL('/')
      await expect(page.locator('text=Sign in')).toBeVisible()
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access protected dashboard without authentication
      await page.goto('/dashboard')

      // Should redirect to login page
      await expect(page).toHaveURL(/\/auth\/login/)
    })

    test('should allow authenticated users to access protected routes', async ({ page }) => {
      // First, log in
      await page.goto('/auth/login')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.click('button[type="submit"]')

      // Should be able to access dashboard
      await expect(page).toHaveURL('/dashboard')
      await expect(page.locator('text=Dashboard')).toBeVisible()

      // Should be able to access other protected routes
      await page.goto('/clubs')
      await expect(page).not.toHaveURL(/\/auth\/login/)
    })
  })

  test.describe('Form Loading States', () => {
    test('should show loading state during login', async ({ page }) => {
      await page.goto('/auth/login')

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')

      // Click submit and immediately check for loading state
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Should show loading text and be disabled
      await expect(submitButton).toContainText(/signing in/i)
      await expect(submitButton).toBeDisabled()
    })

    test('should show loading state during signup', async ({ page }) => {
      await page.goto('/auth/signup')

      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'password123')
      await page.check('input[name="agree"]')

      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Should show loading text and be disabled
      await expect(submitButton).toContainText(/creating account/i)
      await expect(submitButton).toBeDisabled()
    })
  })

  test.describe('Accessibility', () => {
    test('login form should be accessible', async ({ page }) => {
      await page.goto('/auth/login')

      // Check for proper labels
      await expect(page.locator('label[for="email"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()

      // Check for proper form structure
      await expect(page.locator('form')).toBeVisible()
      
      // Check input associations
      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')
      
      await expect(emailInput).toHaveAttribute('id', 'email')
      await expect(passwordInput).toHaveAttribute('id', 'password')
    })

    test('signup form should be accessible', async ({ page }) => {
      await page.goto('/auth/signup')

      // Check for proper labels
      await expect(page.locator('label[for="name"]')).toBeVisible()
      await expect(page.locator('label[for="email"]')).toBeVisible()
      await expect(page.locator('label[for="password"]')).toBeVisible()
      await expect(page.locator('label[for="agree"]')).toBeVisible()

      // Check input associations
      const nameInput = page.locator('input[name="name"]')
      const emailInput = page.locator('input[name="email"]')
      const passwordInput = page.locator('input[name="password"]')
      const agreeCheckbox = page.locator('input[name="agree"]')
      
      await expect(nameInput).toHaveAttribute('id', 'name')
      await expect(emailInput).toHaveAttribute('id', 'email')
      await expect(passwordInput).toHaveAttribute('id', 'password')
      await expect(agreeCheckbox).toHaveAttribute('id', 'agree')
    })
  })
})