import { Page, expect } from '@playwright/test'
import { randomDelay, generateUniqueEmail, waitForCondition } from './test-utils'

/**
 * Helper functions for Magic Link authentication in E2E tests
 */

/**
 * Sends a magic link to the specified email with rate limiting handling
 * @param page - Playwright page object
 * @param email - Email address to send magic link to (if not provided, generates unique one)
 * @param retryOnRateLimit - Whether to retry if rate limited (default: true)
 */
export async function sendMagicLink(page: Page, email?: string, retryOnRateLimit: boolean = true) {
  // Generate unique email if none provided
  if (!email) {
    email = generateUniqueEmail('magic-link')
  }

  // Add random delay to prevent parallel execution conflicts
  await randomDelay(100, 1000)

  await page.goto('/auth/login')
  await page.fill('input[name="email"]', email)
  await page.click('button[type="submit"]')
  
  // Wait for success message or error
  const successMessage = page.locator('text=Check your email')
  const errorMessage = page.locator('text=/rate limit|too many|error/i')
  
  try {
    await expect(successMessage).toBeVisible({ timeout: 5000 })
    return email
  } catch (e) {
    // Check if we got a rate limit error
    if (await errorMessage.isVisible()) {
      const errorText = await errorMessage.textContent()
      
      if (retryOnRateLimit && errorText?.toLowerCase().includes('rate limit')) {
        console.log('Rate limited, waiting and retrying with new email...')
        // Wait for rate limit to reset (typically 15 minutes, but we'll try sooner with new email)
        await randomDelay(5000, 10000)
        
        // Generate new unique email and retry
        const newEmail = generateUniqueEmail('retry-magic-link')
        return await sendMagicLink(page, newEmail, false) // Don't retry again to avoid infinite loop
      }
      
      throw new Error(`Magic link failed: ${errorText}`)
    }
    throw e
  }
}

/**
 * Registers a new user and sends magic link
 * @param page - Playwright page object
 * @param userData - User registration data
 */
export async function registerUserWithMagicLink(
  page: Page, 
  userData: { name: string; email: string; clubName?: string }
) {
  await page.goto('/auth/signup')
  
  await page.fill('input[name="name"]', userData.name)
  await page.fill('input[name="email"]', userData.email)
  
  // Note: clubName field is not in the current signup form - it's handled during registration intent
  // The current form only has name, email, and agree-terms
  
  await page.check('input[name="agree-terms"]')
  await page.click('button[type="submit"]')
  
  // Wait for success message
  await expect(page.locator('text=Check your email')).toBeVisible()
}

/**
 * Simulates clicking a magic link by navigating to the verify URL
 * Note: In a real test environment, you would typically:
 * 1. Retrieve the actual magic link from MailHog API
 * 2. Extract the token from the email
 * 3. Use that token here
 * 
 * @param page - Playwright page object
 * @param token - Magic link token (in real tests, would be extracted from email)
 */
export async function clickMagicLink(page: Page, token: string) {
  await page.goto(`/auth/verify?token=${token}`)
}

/**
 * Creates a mock authenticated session by setting a session cookie
 * Note: This bypasses the actual magic link flow for testing purposes
 * 
 * @param page - Playwright page object
 * @param userId - User ID for the session
 */
export async function createMockAuthSession(page: Page, userId: string = 'test-user-id') {
  // In a real implementation, you would generate a valid JWT token
  // For testing, we can set a mock cookie and rely on the auth middleware
  // to handle it appropriately
  
  await page.context().addCookies([{
    name: 'session',
    value: `mock-jwt-token-${userId}`,
    domain: 'localhost',
    path: '/',
    httpOnly: true
  }])
}

/**
 * Logs out by clicking the sign out button
 * @param page - Playwright page object
 */
export async function signOut(page: Page) {
  const signOutButton = page.locator('button:has-text("Sign out")')
  
  if (await signOutButton.isVisible()) {
    // Click the sign out button
    await signOutButton.click()
    
    // Server actions with redirects can be flaky in tests
    try {
      await page.waitForURL('/', { timeout: 5000 })
    } catch {
      // If redirect doesn't happen, manually check if session was cleared
      await page.goto('/dashboard')
      // Should redirect to login if session was cleared
      await expect(page).toHaveURL(/\/auth\/login/)
    }
  } else {
    throw new Error('Sign out button not found')
  }
}

/**
 * Checks if user is authenticated by trying to access dashboard
 * @param page - Playwright page object
 * @returns Promise<boolean> - True if authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  await page.goto('/dashboard')
  
  // If redirected to login, not authenticated
  if (page.url().includes('/auth/login')) {
    return false
  }
  
  // If we can see dashboard content, authenticated
  return page.url().includes('/dashboard')
}

/**
 * Retrieves magic link from MailHog (if available)
 * This would be used in integration tests with actual email sending
 * 
 * @param email - Email address to search for
 * @returns Promise<string | null> - Magic link URL or null if not found
 */
export async function getMagicLinkFromMailHog(email: string): Promise<string | null> {
  try {
    // Add small delay to prevent overwhelming MailHog API
    await randomDelay(50, 200)
    
    // MailHog API endpoint
    const response = await fetch('http://localhost:8025/api/v2/messages')
    
    if (!response.ok) {
      console.log(`MailHog API returned ${response.status}`)
      return null
    }
    
    const messages = await response.json()
    
    console.log(`Looking for email to ${email}, found ${messages.items?.length || 0} total messages`)
    
    // Find the most recent email to the specified address
    // Sort by timestamp to get most recent first
    const sortedMessages = (messages.items || []).sort((a: any, b: any) => {
      const timeA = new Date(a.Created || 0).getTime()
      const timeB = new Date(b.Created || 0).getTime()
      return timeB - timeA // Most recent first
    })
    
    const emailMessage = sortedMessages.find((msg: any) => {
      const recipients = msg.To || []
      return recipients.some((to: any) => {
        // Construct the full email address from MailHog format
        const toEmail = to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
        
        // Strict matching - must match the exact email address
        const isExactMatch = toEmail === email
        
        if (isExactMatch) {
          console.log(`Found exact email match: ${toEmail} === ${email}`)
        }
        
        return isExactMatch
      })
    })
    
    if (!emailMessage) {
      console.log(`No email found for ${email}`)
      return null
    }
    
    console.log(`Found email for ${email}`)
    
    // Extract magic link from email content
    const emailContent = emailMessage.Content?.Body
    if (!emailContent) {
      return null
    }
    
    // First decode quoted-printable encoding
    let decodedContent = emailContent.replace(/=3D/g, '=')
    // Remove quoted-printable line breaks (= at end of line)
    decodedContent = decodedContent.replace(/=\s*\n/g, '')
    
    // Look for magic link pattern with full 64-character token
    const magicLinkMatch = decodedContent.match(/http[s]?:\/\/[^\s<>"']+\/auth\/verify\?token=([0-9a-fA-F]{64})/i)
    
    if (magicLinkMatch) {
      let link = magicLinkMatch[0]
      // Clean up any remaining HTML entities
      link = link.replace(/&amp;/g, '&')
      // Ensure correct port for local tests
      link = link.replace(':3000', ':3001')
      console.log(`Extracted magic link: ${link}`)
      return link
    }
    
    console.log('No magic link found in email content')
    return null
  } catch (error) {
    console.error('Failed to retrieve magic link from MailHog:', error)
    return null
  }
}

/**
 * Clears all emails from MailHog with retry logic
 * Useful for test cleanup, with staggered execution to prevent conflicts
 */
export async function clearMailHogEmails(): Promise<void> {
  // Add random delay to prevent parallel clearings
  await randomDelay(50, 500)
  
  const success = await waitForCondition(async () => {
    try {
      const response = await fetch('http://localhost:8025/api/v1/messages', {
        method: 'DELETE'
      })
      return response.ok
    } catch (error) {
      console.log('Failed to clear MailHog emails, retrying...', (error as Error).message)
      return false
    }
  }, 3, 1000)
  
  if (!success) {
    console.warn('Failed to clear MailHog emails after retries')
  }
}

/**
 * Full authentication flow using actual magic link from MailHog
 * @param page - Playwright page object
 * @param email - Email address (if not provided, generates unique one)
 * @param maxWaitTime - Maximum time to wait for email (ms)
 */
export async function authenticateWithRealMagicLink(
  page: Page, 
  email?: string,
  maxWaitTime: number = 30000 // Increased timeout for email delivery
): Promise<boolean> {
  // Generate unique email if none provided to avoid conflicts
  if (!email) {
    email = generateUniqueEmail('auth-test')
  }
  
  console.log(`Authenticating with magic link for ${email}`)
  
  // Add staggered delay for parallel execution
  await randomDelay(200, 2000)
  
  // Skip clearing MailHog emails to avoid race condition in parallel tests
  // Unique emails ensure test isolation
  
  // Send magic link with retry logic
  try {
    email = await sendMagicLink(page, email, true)
  } catch (error) {
    console.error('Failed to send magic link:', error)
    return false
  }
  
  // Wait for email and extract magic link
  const startTime = Date.now()
  let magicLink: string | null = null
  
  while (Date.now() - startTime < maxWaitTime && !magicLink) {
    await page.waitForTimeout(2000) // Wait 2 seconds between checks for email delivery
    magicLink = await getMagicLinkFromMailHog(email)
  }
  
  if (!magicLink) {
    console.error('Magic link not received within timeout period')
    return false
  }
  
  // Click the magic link - handle browser-specific navigation issues
  let navigationSucceeded = false
  try {
    await page.goto(magicLink)
    navigationSucceeded = true
  } catch (error) {
    console.log('Navigation error (expected for redirects):', (error as Error).message)
    // Navigation errors are common with server-side redirects
    // The page might have already redirected despite the error
  }
  
  // Wait for any redirects to complete
  await page.waitForTimeout(3000) // Increased timeout for slower browsers
  
  // Check if we ended up on dashboard (success)
  let currentUrl = page.url()
  if (currentUrl.includes('/dashboard')) {
    return true
  }
  
  // If we're still on verify page or login, try waiting for auto-submit to complete
  if (currentUrl.includes('/auth/verify')) {
    console.log('Still on verify page, waiting for auto-submit...')
    await page.waitForTimeout(3000) // Wait for auto-submit and redirect
    currentUrl = page.url()
    
    if (currentUrl.includes('/dashboard')) {
      return true
    }
  }
  
  // If navigation failed initially, try again with wait for load state
  if (!navigationSucceeded || currentUrl.includes('/auth/login')) {
    console.log('Retrying navigation with different approach...')
    try {
      await page.goto(magicLink, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(5000) // Wait longer for form submission
      currentUrl = page.url()
      
      if (currentUrl.includes('/dashboard')) {
        return true
      }
    } catch (retryError) {
      console.log('Retry navigation failed:', (retryError as Error).message)
    }
  }
  
  // Final check - if we're still not on dashboard, consider it failed
  if (currentUrl.includes('/auth/login') || currentUrl.includes('/auth/verify')) {
    console.log('Magic link verification failed - still on auth page')
    return false
  }
  
  // If we're somewhere else, try checking authentication status
  return await isAuthenticated(page)
}