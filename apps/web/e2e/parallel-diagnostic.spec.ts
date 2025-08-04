import { test, expect } from '@playwright/test'
import { generateUniqueEmail, staggerTestExecution } from './helpers/test-utils'

/**
 * Diagnostic to understand parallel execution failures
 */
test.describe('Parallel Execution Diagnostic', () => {
  test('should track parallel form submissions', async ({ page, browserName }) => {
    const testId = `${browserName}-${Math.random().toString(36).substring(7)}`
    console.log(`=== PARALLEL DIAGNOSTIC ${testId} START ===`)
    
    // Track the original worker delay
    await staggerTestExecution(page, 1000)
    console.log(`${testId}: Stagger delay completed`)
    
    const testEmail = generateUniqueEmail(`parallel-${testId}`)
    console.log(`${testId}: Using email ${testEmail}`)
    
    // Check MailHog before
    let beforeCount = 0
    try {
      const beforeResponse = await fetch('http://localhost:8025/api/v2/messages')
      const beforeData = await beforeResponse.json()
      beforeCount = beforeData.items?.length || 0
      console.log(`${testId}: MailHog messages before: ${beforeCount}`)
    } catch (error) {
      console.log(`${testId}: Error checking MailHog before:`, error.message)
    }
    
    // Navigate and submit
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', testEmail)
    
    const submitTime = Date.now()
    await page.click('button[type="submit"]')
    console.log(`${testId}: Form submitted at ${submitTime}`)
    
    // Check result immediately
    const quickResult = await Promise.race([
      page.locator('text=Check your email').waitFor({ timeout: 3000 }).then(() => 'success'),
      page.locator('text=/rate limit|too many/i').waitFor({ timeout: 3000 }).then(() => 'rate_limit'),
      new Promise(resolve => setTimeout(() => resolve('timeout'), 3000))
    ])
    console.log(`${testId}: Quick result: ${quickResult}`)
    
    // Wait longer if needed
    if (quickResult === 'timeout') {
      const extendedResult = await Promise.race([
        page.locator('text=Check your email').waitFor({ timeout: 5000 }).then(() => 'success'),
        page.locator('text=/rate limit|too many/i').waitFor({ timeout: 5000 }).then(() => 'rate_limit'),
        new Promise(resolve => setTimeout(() => resolve('extended_timeout'), 5000))
      ])
      console.log(`${testId}: Extended result: ${extendedResult}`)
    }
    
    // Check if rate limited
    if (await page.locator('text=/rate limit|too many/i').isVisible()) {
      const errorText = await page.locator('text=/rate limit|too many/i').textContent()
      console.log(`${testId}: Rate limit error: ${errorText}`)
    }
    
    // Wait for email delivery
    await page.waitForTimeout(4000)
    
    // Check MailHog after
    try {
      const afterResponse = await fetch('http://localhost:8025/api/v2/messages')
      const afterData = await afterResponse.json()
      const afterCount = afterData.items?.length || 0
      console.log(`${testId}: MailHog messages after: ${afterCount} (added: ${afterCount - beforeCount})`)
      
      if (afterCount > beforeCount) {
        // Look for our message
        const ourMessage = afterData.items?.find((msg: any) => {
          const recipients = msg.To || []
          return recipients.some((to: any) => {
            const toEmail = to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
            return toEmail === testEmail
          })
        })
        console.log(`${testId}: Found our message in MailHog: ${!!ourMessage}`)
        if (ourMessage) {
          console.log(`${testId}: Message created: ${ourMessage.Created}`)
        }
      }
      
      // Show all recent messages for debugging
      const recent = afterData.items?.slice(0, 3) || []
      console.log(`${testId}: Recent messages:`)
      recent.forEach((msg: any, idx: number) => {
        const recipients = msg.To || []
        const toEmails = recipients.map((to: any) => 
          to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
        )
        console.log(`${testId}:   ${idx + 1}. To=${JSON.stringify(toEmails)}, Created=${msg.Created}`)
      })
    } catch (error) {
      console.log(`${testId}: Error checking MailHog after:`, error.message)
    }
    
    console.log(`=== PARALLEL DIAGNOSTIC ${testId} END ===`)
    expect(true).toBeTruthy()
  })
})