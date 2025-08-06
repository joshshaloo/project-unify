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
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Please fill in all required fields')).toBeVisible()
      await expect(page).toHaveURL(/\/clubs\/.*\/teams\/.*\/sessions/)
    })

    test('should prevent past date selection', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const yesterdayStr = yesterday.toISOString().split('T')[0]

      await page.fill('input[name="date"]', yesterdayStr)
      await page.fill('input[name="time"]', '10:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=Session date and time must be in the future')).toBeVisible()
    })

    test('should validate individual required fields', async () => {
      // Test missing date
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Please fill in all required fields')).toBeVisible()

      // Reset and test missing time
      await page.reload()
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Please fill in all required fields')).toBeVisible()
    })
  })

  test.describe('Form Accessibility', () => {
    test('should be keyboard navigable', async () => {
      const testEmail = 'alex@lightningfc.com'
      await authenticateUser(page, testEmail)
      await page.goto('/clubs/test-club/teams/test-team/sessions')
      await page.waitForLoadState('networkidle')

      // Navigate through form using tab
      await page.keyboard.press('Tab') // Focus on date input
      await expect(page.locator('input[name="date"]')).toBeFocused()

      await page.keyboard.press('Tab') // Time input
      await expect(page.locator('input[name="time"]')).toBeFocused()

      await page.keyboard.press('Tab') // Duration select
      await expect(page.locator('select[name="duration"]')).toBeFocused()

      await page.keyboard.press('Tab') // Session type select
      await expect(page.locator('select[name="sessionType"]')).toBeFocused()

      await page.keyboard.press('Tab') // Focus areas input
      await expect(page.locator('input[name="focus"]')).toBeFocused()

      await page.keyboard.press('Tab') // Equipment input
      await expect(page.locator('input[name="equipment"]')).toBeFocused()

      await page.keyboard.press('Tab') // Submit button
      await expect(page.locator('button[type="submit"]')).toBeFocused()
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