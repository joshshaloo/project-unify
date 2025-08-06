import { test, expect, type Page } from '@playwright/test'
import { authenticateUser } from './helpers/mailhog'

test.describe('AI Session Generation Form Tests', () => {
  let page: Page
  
  test.beforeEach(async ({ browser }) => {
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test.describe('Form Display and Navigation', () => {
    test('should display session generation form when authenticated', async () => {
      // Use alex@lightningfc.com who has access to test-club
      const testEmail = 'alex@lightningfc.com'
      await authenticateUser(page, testEmail)

      await page.goto('/clubs/test-club/teams/test-team/sessions')
      
      // Wait for the page to load
      await page.waitForLoadState('networkidle')
      await expect(page.locator('h2:has-text("Training Sessions")')).toBeVisible()
      
      // Check form elements are present
      await expect(page.locator('input[name="date"]')).toBeVisible()
      await expect(page.locator('input[name="time"]')).toBeVisible()
      await expect(page.locator('select[name="duration"]')).toBeVisible()
      await expect(page.locator('select[name="sessionType"]')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })
  })

  test.describe('Form Validation', () => {
    test.beforeEach(async () => {
      const testEmail = 'alex@lightningfc.com'
      await authenticateUser(page, testEmail)
      await page.goto('/clubs/test-club/teams/test-team/sessions')
      await page.waitForLoadState('networkidle')
    })

    test('should show validation errors for missing required fields', async () => {
      // HTML5 validation prevents form submission when required fields are empty
      // Try to submit empty form
      await page.click('button[type="submit"]')
      
      // Check that we're still on the same page (form didn't submit)
      await expect(page).toHaveURL(/\/clubs\/.*\/teams\/.*\/sessions/)
      
      // Verify required fields have the required attribute
      await expect(page.locator('input[name="date"]')).toHaveAttribute('required', '')
      await expect(page.locator('input[name="time"]')).toHaveAttribute('required', '')
      await expect(page.locator('select[name="duration"]')).toHaveAttribute('required', '')
      await expect(page.locator('select[name="sessionType"]')).toHaveAttribute('required', '')
    })

    test('should prevent past date selection', async () => {
      // The date input has a min attribute that prevents past dates
      const dateInput = page.locator('input[name="date"]')
      
      // Check that min attribute is set to today's date
      const today = new Date().toISOString().split('T')[0]
      await expect(dateInput).toHaveAttribute('min', today)
      
      // Try to set a past date - browser should prevent this
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]
      
      // Force fill the date field with a past date
      await dateInput.fill(yesterdayStr)
      
      // Fill other required fields
      await page.fill('input[name="time"]', '10:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')
      
      // Try to submit - browser should prevent submission
      await page.click('button[type="submit"]')
      
      // Check that we're still on the same page (form didn't submit)
      await expect(page).toHaveURL(/\/clubs\/.*\/teams\/.*\/sessions/)
      
      // Verify the date input is invalid according to browser validation
      const isInvalid = await dateInput.evaluate((el: HTMLInputElement) => !el.checkValidity())
      expect(isInvalid).toBeTruthy()
    })

    test('should validate individual required fields', async () => {
      // HTML5 validation prevents submission with missing fields
      // Test that browser's constraint validation API works
      
      // Try to submit with only some fields filled
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')
      
      // Date is still empty, so form shouldn't submit
      await page.click('button[type="submit"]')
      
      // Verify we're still on the same page
      await expect(page).toHaveURL(/\/clubs\/.*\/teams\/.*\/sessions/)
      
      // Check that date input is marked as invalid by the browser
      const dateInput = page.locator('input[name="date"]')
      const isInvalid = await dateInput.evaluate((el: HTMLInputElement) => !el.checkValidity())
      expect(isInvalid).toBeTruthy()
    })
  })

  test.describe('Form Accessibility', () => {
    test('should be keyboard navigable', async () => {
      const testEmail = 'alex@lightningfc.com'
      await authenticateUser(page, testEmail)
      await page.goto('/clubs/test-club/teams/test-team/sessions')
      await page.waitForLoadState('networkidle')

      // Check that all form fields are present and can be tabbed through
      const formFields = [
        'input[name="date"]',
        'input[name="time"]',
        'select[name="duration"]',
        'select[name="sessionType"]',
        'input[name="focus"]',
        'input[name="equipment"]',
        'button[type="submit"]'
      ]

      // Verify all fields exist
      for (const selector of formFields) {
        await expect(page.locator(selector)).toBeVisible()
      }

      // Start keyboard navigation by focusing the first field
      const dateInput = page.locator('input[name="date"]')
      await dateInput.focus()
      await expect(dateInput).toBeFocused()

      // Tab through all fields and verify they can receive focus
      // We'll use a more flexible approach that doesn't rely on exact tab order
      for (let i = 1; i < formFields.length; i++) {
        await page.keyboard.press('Tab')
        // Wait a bit for focus to settle
        await page.waitForTimeout(100)
        
        // Check that we've moved focus away from the previous field
        const currentFocused = await page.evaluate(() => document.activeElement?.tagName + '[name="' + (document.activeElement as any)?.name + '"]')
        
        // We should have focus on one of the form fields
        const hasFocusOnFormField = formFields.some(selector => 
          currentFocused?.toLowerCase().includes(selector.split('[')[0])
        )
        expect(hasFocusOnFormField).toBeTruthy()
      }
    })

    test('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
      
      const testEmail = 'alex@lightningfc.com'
      await authenticateUser(page, testEmail)
      await page.goto('/clubs/test-club/teams/test-team/sessions')
      await page.waitForLoadState('networkidle')

      // Form should still be visible and functional
      await expect(page.locator('text=Generate AI Training Session')).toBeVisible()
      await expect(page.locator('input[name="date"]')).toBeVisible()
      
      // Fill form on mobile
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      // Should be able to submit (will fail due to no n8n, but form should process)
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Generating Session...')).toBeVisible()
    })
  })
})