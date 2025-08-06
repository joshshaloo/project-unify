import { test, expect } from '@playwright/test'
import { generateUniqueEmail } from './helpers/test-utils'

/**
 * Diagnostic test specifically for Webkit form submission issues
 */
test.describe('Webkit Diagnostic Tests', () => {
  test('should debug Webkit form submission', async ({ page }) => {
    console.log('=== WEBKIT FORM SUBMISSION DIAGNOSTIC ===')
    
    const testEmail = generateUniqueEmail('webkit-debug')
    console.log(`Using email: ${testEmail}`)
    
    // Check initial MailHog state
    const mailhogUrl = process.env.MAILHOG_URL || 'http://localhost:8025'
    const initialResponse = await fetch(`${mailhogUrl}/api/v2/messages`)
    const initialData = await initialResponse.json()
    const initialCount = initialData.items?.length || 0
    console.log(`Initial MailHog messages: ${initialCount}`)
    
    // Navigate to login
    await page.goto('/auth/login')
    console.log('Navigated to login page')
    
    // Check if page loaded correctly
    const emailInputVisible = await page.locator('input[name="email"]').isVisible()
    const submitButtonVisible = await page.locator('button[type="submit"]').isVisible()
    console.log(`Email input visible: ${emailInputVisible}`)
    console.log(`Submit button visible: ${submitButtonVisible}`)
    
    // Fill form
    await page.fill('input[name="email"]', testEmail)
    const inputValue = await page.locator('input[name="email"]').inputValue()
    console.log(`Input value after fill: ${inputValue}`)
    
    // Intercept network requests to see what's happening
    const requests: any[] = []
    page.on('request', request => {
      if (request.url().includes('/auth/login') || request.url().includes('api')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postData()
        })
      }
    })
    
    // Intercept responses
    const responses: any[] = []
    page.on('response', response => {
      if (response.url().includes('/auth/login') || response.url().includes('api')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        })
      }
    })
    
    // Submit form
    console.log('Submitting form...')
    await page.click('button[type="submit"]')
    
    // Wait for any requests to complete
    await page.waitForTimeout(3000)
    
    console.log('Network requests:')
    requests.forEach((req, idx) => {
      console.log(`  ${idx + 1}. ${req.method} ${req.url}`)
      if (req.postData) {
        console.log(`     Data: ${req.postData}`)
      }
    })
    
    console.log('Network responses:')
    responses.forEach((res, idx) => {
      console.log(`  ${idx + 1}. ${res.status} ${res.url}`)
    })
    
    // Check for success/error messages
    const successVisible = await page.locator('text=Check your email').isVisible()
    const errorVisible = await page.locator('.text-red-800, [role="alert"]').isVisible()
    const loadingVisible = await page.locator('button[disabled]').isVisible()
    
    console.log(`Success message visible: ${successVisible}`)
    console.log(`Error message visible: ${errorVisible}`)
    console.log(`Loading state visible: ${loadingVisible}`)
    
    if (errorVisible) {
      const errorText = await page.locator('.text-red-800, [role="alert"]').textContent()
      console.log(`Error text: ${errorText}`)
    }
    
    // Check final MailHog state
    await page.waitForTimeout(2000)
    const finalResponse = await fetch(`${mailhogUrl}/api/v2/messages`)
    const finalData = await finalResponse.json()
    const finalCount = finalData.items?.length || 0
    console.log(`Final MailHog messages: ${finalCount}`)
    console.log(`Messages added: ${finalCount - initialCount}`)
    
    if (finalCount > initialCount) {
      const newMessages = finalData.items.slice(0, finalCount - initialCount)
      console.log('New messages:')
      newMessages.forEach((msg: any, idx: number) => {
        const recipients = msg.To || []
        const toEmails = recipients.map((to: any) => 
          to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
        )
        console.log(`  ${idx + 1}. To=${JSON.stringify(toEmails)}, Created=${msg.Created}`)
      })
    }
    
    console.log('=== WEBKIT DIAGNOSTIC END ===')
    expect(true).toBeTruthy()
  })
})