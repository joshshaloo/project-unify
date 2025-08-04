import { test, expect, type Page } from '@playwright/test'
import { faker } from '@faker-js/faker'

test.describe('AI Session Generation E2E Tests', () => {
  let page: Page
  
  // Test data
  const clubData = {
    name: `${faker.word.adjective()} ${faker.word.noun()} FC`,
  }

  const teamData = {
    name: `U${faker.number.int({ min: 8, max: 18 })} ${faker.word.noun()}s`,
    ageGroup: 'U12',
    skillLevel: 'intermediate',
  }

  const userData = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
  }

  test.beforeEach(async ({ browser }) => {
    // Start with a fresh browser context for each test
    const context = await browser.newContext()
    page = await context.newPage()
  })

  test.describe('Complete User Flow - Session Generation', () => {
    test('should allow user to login, navigate to team, generate session, and view session', async () => {
      // Step 1: Navigate to home page
      await page.goto('/')
      await expect(page).toHaveTitle(/Soccer AI Platform/)

      // Step 2: Sign up (in a real E2E test, we'd use an existing test user)
      await page.click('text=Create Account')
      await expect(page).toHaveURL('/auth/signup')

      await page.fill('input[name="name"]', userData.name)
      await page.fill('input[name="email"]', userData.email)
      await page.check('input[name="agree-terms"]')
      await page.click('button[type="submit"]')

      // Step 3: Complete onboarding (assuming magic link verification would be handled in test setup)
      // This would typically involve intercepting the magic link email and following it
      // For this test, we'll assume we're redirected to onboarding after magic link verification
      
      // Mock the authentication state (in real tests, this would be handled by the magic link flow)
      await page.goto('/onboarding')
      
      // Complete onboarding form
      await page.fill('input[name="name"]', userData.name)
      await page.selectOption('select[name="role"]', 'head_coach')
      await page.fill('input[name="clubName"]', clubData.name)
      await page.click('button[type="submit"]')

      // Step 4: Should be redirected to dashboard
      await expect(page).toHaveURL(/\/clubs\/.*\/dashboard/)
      await expect(page.locator('h1')).toContainText('Dashboard')

      // Step 5: Create a team (prerequisite for session generation)
      await page.click('text=Teams')
      await expect(page).toHaveURL(/\/clubs\/.*\/teams/)
      
      await page.click('text=Create Team')
      await page.fill('input[name="name"]', teamData.name)
      await page.selectOption('select[name="ageGroup"]', teamData.ageGroup)
      await page.selectOption('select[name="skillLevel"]', teamData.skillLevel)
      await page.click('button[type="submit"]')

      // Should see the new team
      await expect(page.locator('text=' + teamData.name)).toBeVisible()

      // Step 6: Navigate to team sessions
      await page.click(`text=${teamData.name}`)
      await expect(page).toHaveURL(/\/clubs\/.*\/teams\/.*/)
      
      await page.click('text=Sessions')
      await expect(page).toHaveURL(/\/clubs\/.*\/teams\/.*\/sessions/)

      // Step 7: Generate AI session
      await expect(page.locator('h1')).toContainText('Training Sessions')
      await expect(page.locator('text=Generate AI Training Session')).toBeVisible()

      // Fill out session generation form
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      await page.fill('input[name="date"]', tomorrowStr)
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')
      await page.fill('input[name="focus"]', 'passing, shooting')
      await page.fill('input[name="equipment"]', 'cones, balls, goals')

      // Submit form
      await page.click('button[type="submit"]')

      // Step 8: Should show loading state
      await expect(page.locator('text=Generating Session...')).toBeVisible()

      // Step 9: Should be redirected to generated session page
      await expect(page).toHaveURL(/\/clubs\/.*\/sessions\/.*/, { timeout: 30000 })
      
      // Verify session content
      await expect(page.locator('h1')).toContainText('Training Session')
      await expect(page.locator('text=AI Generated')).toBeVisible()
      
      // Should see session phases
      await expect(page.locator('text=Warm-Up')).toBeVisible()
      await expect(page.locator('text=Main Activities')).toBeVisible()
      await expect(page.locator('text=Cool-Down')).toBeVisible()

      // Should see session details
      await expect(page.locator('text=90 minutes')).toBeVisible()
      await expect(page.locator('text=passing')).toBeVisible()
      await expect(page.locator('text=shooting')).toBeVisible()

      // Step 10: Verify we can navigate back to sessions list
      await page.click('text=Back to Sessions')
      await expect(page).toHaveURL(/\/clubs\/.*\/teams\/.*\/sessions/)
      
      // Should see the generated session in the list
      await expect(page.locator('[data-testid="session-card"]')).toBeVisible()
    })

    test('should handle session generation with minimal data', async () => {
      // Assume user is already logged in and has a team (setup would be done in beforeEach in real tests)
      await setupAuthenticatedUserWithTeam()

      await page.goto('/clubs/test-club/teams/test-team/sessions')

      // Fill minimal required fields only
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      await page.fill('input[name="date"]', tomorrowStr)
      await page.fill('input[name="time"]', '10:00')
      await page.selectOption('select[name="duration"]', '60')
      await page.selectOption('select[name="sessionType"]', 'training')
      
      // Leave optional fields empty
      await page.click('button[type="submit"]')

      await expect(page.locator('text=Generating Session...')).toBeVisible()
      await expect(page).toHaveURL(/\/clubs\/.*\/sessions\/.*/, { timeout: 30000 })
      
      // Should still generate a valid session
      await expect(page.locator('h1')).toContainText('Training Session')
      await expect(page.locator('text=60 minutes')).toBeVisible()
    })

    test('should handle different session types', async () => {
      await setupAuthenticatedUserWithTeam()
      await page.goto('/clubs/test-club/teams/test-team/sessions')

      const sessionTypes = ['training', 'match_prep', 'skills']

      for (const sessionType of sessionTypes) {
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10 + sessionTypes.indexOf(sessionType), 0, 0, 0)
        const tomorrowStr = tomorrow.toISOString().split('T')[0]
        const timeStr = tomorrow.toTimeString().slice(0, 5)

        await page.fill('input[name="date"]', tomorrowStr)
        await page.fill('input[name="time"]', timeStr)
        await page.selectOption('select[name="duration"]', '75')
        await page.selectOption('select[name="sessionType"]', sessionType)
        await page.fill('input[name="focus"]', `${sessionType} focus`)

        await page.click('button[type="submit"]')
        await expect(page.locator('text=Generating Session...')).toBeVisible()
        
        await expect(page).toHaveURL(/\/clubs\/.*\/sessions\/.*/, { timeout: 30000 })
        await expect(page.locator('h1')).toContainText('Training Session')

        // Navigate back for next iteration
        await page.goBack()
        await page.waitForLoadState('networkidle')
      }
    })
  })

  test.describe('Form Validation E2E', () => {
    test.beforeEach(async () => {
      await setupAuthenticatedUserWithTeam()
      await page.goto('/clubs/test-club/teams/test-team/sessions')
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

    test('should handle form reset after validation error', async () => {
      // Trigger validation error
      await page.click('button[type="submit"]')
      await expect(page.locator('text=Please fill in all required fields')).toBeVisible()

      // Fill valid data
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '14:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      // Error should disappear and generation should start
      await expect(page.locator('text=Please fill in all required fields')).not.toBeVisible()
      await expect(page.locator('text=Generating Session...')).toBeVisible()
    })
  })

  test.describe('Error Scenarios E2E', () => {
    test.beforeEach(async () => {
      await setupAuthenticatedUserWithTeam()
      await page.goto('/clubs/test-club/teams/test-team/sessions')
    })

    test('should handle network failures gracefully', async () => {
      // Intercept and fail the AI generation request
      await page.route('**/api/trpc/ai.generateSession*', route => {
        route.abort('failed')
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('.bg-red-50')).toBeVisible()
      await expect(page.locator('text=Failed to generate session')).toBeVisible()

      // Form should still be functional
      await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
    })

    test('should handle API timeout errors', async () => {
      // Simulate a very slow response
      await page.route('**/api/trpc/ai.generateSession*', async route => {
        await new Promise(resolve => setTimeout(resolve, 35000)) // Longer than typical timeout
        route.continue()
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      // Should eventually show timeout error
      await expect(page.locator('text=timed out').or(page.locator('text=timeout'))).toBeVisible({ timeout: 40000 })
    })

    test('should handle invalid server responses', async () => {
      // Return invalid JSON
      await page.route('**/api/trpc/ai.generateSession*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: 'invalid json response'
        })
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      await expect(page.locator('.bg-red-50')).toBeVisible()
      await expect(page.locator('text=Failed to generate session')).toBeVisible()
    })

    test('should handle authentication errors', async () => {
      // Return 401 unauthorized
      await page.route('**/api/trpc/ai.generateSession*', route => {
        route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Unauthorized',
              code: 'UNAUTHORIZED'
            }
          })
        })
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      // Should show unauthorized error or redirect to login
      await expect(
        page.locator('text=Unauthorized').or(page.locator('text=Please log in'))
      ).toBeVisible()
    })

    test('should handle team not found errors', async () => {
      await page.route('**/api/trpc/ai.generateSession*', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            error: {
              message: 'Team not found',
              code: 'NOT_FOUND'
            }
          })
        })
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=Team not found')).toBeVisible()
    })
  })

  test.describe('Loading States and UX', () => {
    test.beforeEach(async () => {
      await setupAuthenticatedUserWithTeam()
      await page.goto('/clubs/test-club/teams/test-team/sessions')
    })

    test('should show proper loading states during generation', async () => {
      // Add delay to API call to observe loading state
      await page.route('**/api/trpc/ai.generateSession*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        route.continue()
      })

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      // Should immediately show loading state
      await expect(page.locator('text=Generating Session...')).toBeVisible()
      await expect(page.locator('button[type="submit"]')).toBeDisabled()
      await expect(page.locator('.animate-spin')).toBeVisible() // Loading spinner

      // Form should be disabled during loading
      await expect(page.locator('input[name="date"]')).toBeDisabled()
      await expect(page.locator('input[name="time"]')).toBeDisabled()
    })

    test('should restore form state after successful generation', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      // Wait for generation to complete and redirect
      await expect(page).toHaveURL(/\/clubs\/.*\/sessions\/.*/, { timeout: 30000 })

      // Navigate back to form
      await page.goBack()

      // Form should be reset and functional
      await expect(page.locator('button[type="submit"]')).not.toBeDisabled()
      await expect(page.locator('input[name="date"]')).not.toBeDisabled()
      await expect(page.locator('text=Generating Session...')).not.toBeVisible()
    })

    test('should show success message before redirect', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      await page.fill('input[name="date"]', tomorrow.toISOString().split('T')[0])
      await page.fill('input[name="time"]', '15:00')
      await page.selectOption('select[name="duration"]', '90')
      await page.selectOption('select[name="sessionType"]', 'training')

      await page.click('button[type="submit"]')

      // Should briefly show success message
      await expect(page.locator('text=Session generated successfully!')).toBeVisible()
      
      // Then redirect to session page
      await expect(page).toHaveURL(/\/clubs\/.*\/sessions\/.*/, { timeout: 30000 })
    })
  })

  test.describe('Accessibility and Mobile Support', () => {
    test('should be keyboard navigable', async () => {
      await setupAuthenticatedUserWithTeam()
      await page.goto('/clubs/test-club/teams/test-team/sessions')

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

      // Should be able to submit with Enter
      await page.keyboard.press('Enter')
      await expect(page.locator('text=Please fill in all required fields')).toBeVisible()
    })

    test('should work on mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE size
      
      await setupAuthenticatedUserWithTeam()
      await page.goto('/clubs/test-club/teams/test-team/sessions')

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

      await page.click('button[type="submit"]')
      await expect(page.locator('text=Generating Session...')).toBeVisible()
    })
  })

  // Helper function to set up authenticated user with team
  // In real tests, this would be a proper test fixture
  async function setupAuthenticatedUserWithTeam() {
    // This would typically involve:
    // 1. Creating test user in database
    // 2. Creating test club and team
    // 3. Setting up authentication cookies/tokens
    // 4. Potentially seeding the database with test data
    
    // For this example, we'll assume these are handled by test setup
    // and just navigate to the appropriate page
    
    // Mock authentication by setting cookies or local storage
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'test-auth-token')
    })
    
    // In a real test, you'd have proper test data setup
    await page.route('**/api/trpc/teams.getById*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            data: {
              id: 'test-team',
              name: 'Test Team',
              ageGroup: 'U12',
              skillLevel: 'intermediate',
              clubId: 'test-club'
            }
          }
        })
      })
    })
  }
})