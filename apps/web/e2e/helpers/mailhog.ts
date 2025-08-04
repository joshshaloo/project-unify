import { Page } from '@playwright/test'

interface MailHogMessage {
  ID: string
  From: { Domain: string; Mailbox: string; Params: string; Relays: null }
  To: Array<{ Domain: string; Mailbox: string; Params: string; Relays: null }>
  Content: {
    Headers: Record<string, string[]>
    Body: string
    Size: number
    MIME: null
  }
  Created: string
  MIME: null
  Raw: {
    From: string
    To: string[]
    Data: string
  }
}

interface MailHogResponse {
  total: number
  count: number
  start: number
  items: MailHogMessage[]
}

export class MailHogHelper {
  private mailhogUrl: string

  constructor(mailhogUrl: string = 'http://localhost:8025') {
    this.mailhogUrl = mailhogUrl
  }

  async getMessages(): Promise<MailHogMessage[]> {
    const response = await fetch(`${this.mailhogUrl}/api/v2/messages`)
    const data: MailHogResponse = await response.json()
    return data.items
  }

  async getLatestMessage(toEmail: string): Promise<MailHogMessage | null> {
    const messages = await this.getMessages()
    
    // Filter messages for the specific email with exact matching
    const filtered = messages.filter(msg => 
      msg.To.some(to => {
        const fullEmail = to.Mailbox && to.Domain ? `${to.Mailbox}@${to.Domain}` : to.Mailbox
        return fullEmail === toEmail
      })
    )
    
    if (filtered.length === 0) {
      return null
    }
    
    // Sort by creation time to get the most recent
    const sorted = filtered.sort((a, b) => {
      const timeA = new Date(a.Created).getTime()
      const timeB = new Date(b.Created).getTime()
      return timeB - timeA // Most recent first
    })
    
    return sorted[0]
  }

  async deleteAllMessages(): Promise<void> {
    await fetch(`${this.mailhogUrl}/api/v1/messages`, { method: 'DELETE' })
  }

  extractMagicLink(message: MailHogMessage): string | null {
    const body = message.Content.Body
    
    // First decode quoted-printable encoding
    let decodedBody = body.replace(/=3D/g, '=')
    // Remove quoted-printable line breaks (= at end of line)
    decodedBody = decodedBody.replace(/=\s*\n/g, '')
    
    // Look for magic link pattern in the email body
    // Match the full token which is 64 hex characters
    const linkMatch = decodedBody.match(/http[s]?:\/\/[^\s<>"']+\/auth\/verify\?token=([0-9a-fA-F]{64})/i)
    if (linkMatch) {
      let link = linkMatch[0]
      // Clean up any remaining HTML entities
      link = link.replace(/&amp;/g, '&')
      // Ensure correct port for local tests
      link = link.replace(':3000', ':3001')
      return link
    }
    return null
  }

  async waitForMessage(toEmail: string, timeout: number = 10000): Promise<MailHogMessage | null> {
    const startTime = Date.now()
    let attempt = 0
    
    while (Date.now() - startTime < timeout) {
      attempt++
      
      try {
        const message = await this.getLatestMessage(toEmail)
        if (message) {
          console.log(`Found message for ${toEmail} after ${attempt} attempts`)
          return message
        }
      } catch (error) {
        console.log(`MailHog API error on attempt ${attempt}:`, (error as Error).message)
      }
      
      // Progressive backoff: start with shorter delays, increase for later attempts
      const delay = Math.min(200 + (attempt * 100), 2000)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    console.log(`No message found for ${toEmail} after ${attempt} attempts over ${timeout}ms`)
    return null
  }
}

export async function getMagicLinkFromEmail(email: string): Promise<string | null> {
  const mailhog = new MailHogHelper()
  const message = await mailhog.waitForMessage(email)
  
  if (!message) {
    console.error(`No email found for ${email}`)
    return null
  }
  
  const magicLink = mailhog.extractMagicLink(message)
  if (!magicLink) {
    console.error(`No magic link found in email for ${email}`)
  }
  
  return magicLink
}

export async function authenticateUser(page: Page, email: string): Promise<void> {
  // Skip clearing messages to avoid race condition in parallel tests
  const mailhog = new MailHogHelper()
  // await mailhog.deleteAllMessages() - removed to fix parallel test issues
  
  // Navigate to login page
  await page.goto('/auth/login')
  
  // Submit magic link request
  await page.fill('input[name="email"]', email)
  await page.click('button[type="submit"]')
  
  // Wait for success message
  await page.waitForSelector('text=Check your email', { timeout: 10000 })
  
  // Get magic link from email
  const magicLink = await getMagicLinkFromEmail(email)
  if (!magicLink) {
    throw new Error(`Failed to get magic link for ${email}`)
  }
  
  // Navigate to magic link
  await page.goto(magicLink)
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })
}