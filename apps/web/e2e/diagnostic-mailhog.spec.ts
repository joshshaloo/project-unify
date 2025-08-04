import { test, expect } from '@playwright/test'
import { generateUniqueEmail, randomDelay } from './helpers/test-utils'

/**
 * Diagnostic test to analyze MailHog behavior under parallel load
 */
test.describe('MailHog Diagnostic Tests', () => {
  test('should analyze MailHog API responses', async ({ page }) => {
    console.log('=== MAILHOG DIAGNOSTIC TEST START ===')
    
    // Generate unique email
    const testEmail = generateUniqueEmail('diagnostic')
    console.log(`Using test email: ${testEmail}`)
    
    // Check MailHog API directly
    console.log('1. Checking MailHog API availability...')
    try {
      const response = await fetch('http://localhost:8025/api/v2/messages')
      console.log(`MailHog API status: ${response.status}`)
      const data = await response.json()
      console.log(`Current messages in MailHog: ${data.items?.length || 0}`)
    } catch (error) {
      console.error('MailHog API error:', error)
    }
    
    // Navigate to login
    console.log('2. Navigating to login page...')
    await page.goto('/auth/login')
    
    // Fill and submit form
    console.log('3. Submitting magic link form...')
    await page.fill('input[name="email"]', testEmail)
    await page.click('button[type="submit"]')
    
    // Check for success or error
    console.log('4. Checking form submission result...')
    const successVisible = await page.locator('text=Check your email').isVisible({ timeout: 5000 }).catch(() => false)
    const errorVisible = await page.locator('text=/rate limit|too many|error/i').isVisible({ timeout: 2000 }).catch(() => false)
    
    console.log(`Success message visible: ${successVisible}`)
    console.log(`Error message visible: ${errorVisible}`)
    
    if (errorVisible) {
      const errorText = await page.locator('text=/rate limit|too many|error/i').textContent()
      console.log(`Error text: ${errorText}`)
    }
    
    // Wait for email delivery
    console.log('5. Waiting for email delivery...')
    await page.waitForTimeout(3000)
    
    // Check MailHog again
    console.log('6. Checking MailHog for new messages...')
    try {
      const response = await fetch('http://localhost:8025/api/v2/messages')
      const data = await response.json()
      console.log(`Messages after submission: ${data.items?.length || 0}`)
      
      if (data.items && data.items.length > 0) {
        console.log('Recent messages:')
        data.items.slice(0, 3).forEach((msg: any, idx: number) => {
          const recipients = msg.To || []
          const toEmails = recipients.map((to: any) => 
            to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
          )
          console.log(`  Message ${idx + 1}: To=${JSON.stringify(toEmails)}, Subject=${msg.Subject}`)
        })
        
        // Look for our specific email
        const ourMessage = data.items.find((msg: any) => {
          const recipients = msg.To || []
          return recipients.some((to: any) => {
            const toEmail = to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
            return toEmail === testEmail
          })
        })
        
        console.log(`Found our message: ${!!ourMessage}`)
        if (ourMessage) {
          console.log(`Our message details: Subject=${ourMessage.Subject}, Created=${ourMessage.Created}`)
        }
      }
    } catch (error) {
      console.error('Error checking MailHog after submission:', error)
    }
    
    console.log('=== MAILHOG DIAGNOSTIC TEST END ===')
    
    // The test should pass regardless of email success
    expect(true).toBeTruthy()
  })
  
  test('should test parallel MailHog access', async ({ page }) => {
    const testId = Math.random().toString(36).substring(7)
    console.log(`=== PARALLEL TEST ${testId} START ===`)
    
    // Add random delay to stagger execution
    const delay = Math.random() * 3000
    console.log(`Delaying ${Math.round(delay)}ms...`)
    await page.waitForTimeout(delay)
    
    const testEmail = generateUniqueEmail(`parallel-${testId}`)
    console.log(`Test ${testId} using email: ${testEmail}`)
    
    // Submit form
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', testEmail)
    await page.click('button[type="submit"]')
    
    // Check result
    const result = await Promise.race([
      page.locator('text=Check your email').waitFor({ timeout: 8000 }).then(() => 'success'),
      page.locator('text=/rate limit|too many/i').waitFor({ timeout: 8000 }).then(() => 'rate_limit'),
      new Promise(resolve => setTimeout(() => resolve('timeout'), 8000))
    ])
    
    console.log(`Test ${testId} result: ${result}`)
    
    // Check MailHog
    await page.waitForTimeout(2000)
    try {
      const response = await fetch('http://localhost:8025/api/v2/messages')
      const data = await response.json()
      const ourMessage = data.items?.find((msg: any) => {
        const recipients = msg.To || []
        return recipients.some((to: any) => {
          const toEmail = to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
          return toEmail === testEmail
        })
      })
      console.log(`Test ${testId} found in MailHog: ${!!ourMessage}`)
    } catch (error) {
      console.log(`Test ${testId} MailHog check failed:`, (error as Error).message)
    }
    
    console.log(`=== PARALLEL TEST ${testId} END ===`)
    expect(true).toBeTruthy()
  })
})