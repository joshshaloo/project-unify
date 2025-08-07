/**
 * Test utilities for handling parallel execution and resource contention
 */

/**
 * Generate a random delay to prevent parallel tests from executing simultaneously
 * @param minMs Minimum delay in milliseconds (default: 100)
 * @param maxMs Maximum delay in milliseconds (default: 3000)
 */
export async function randomDelay(minMs: number = 100, maxMs: number = 3000): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  await new Promise(resolve => setTimeout(resolve, delay))
}

/**
 * Generate a unique email address for testing
 * Uses multiple entropy sources to ensure uniqueness across parallel tests
 * @param prefix Email prefix (default: 'test')
 * @param domain Email domain (default: 'example.com')
 */
export function generateUniqueEmail(prefix: string = 'test', domain: string = 'example.com'): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const processId = process.pid || Math.floor(Math.random() * 10000)
  
  return `${prefix}-${timestamp}-${randomId}-${processId}@${domain}`
}

/**
 * Wait for a condition with exponential backoff retry
 * Useful for handling rate limiting and temporary failures
 * @param condition Function that returns true when condition is met
 * @param maxAttempts Maximum number of retry attempts (default: 5)
 * @param initialDelayMs Initial delay between retries (default: 1000)
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  maxAttempts: number = 5,
  initialDelayMs: number = 1000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await condition()
      if (result) {
        return true
      }
    } catch (error) {
    }

    if (attempt < maxAttempts) {
      // Exponential backoff with jitter
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }

  return false
}

/**
 * Create a unique test identifier for the current test execution
 * Combines test info with process and timing data
 */
export function createTestId(): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 10)
  const processId = process.pid || Math.floor(Math.random() * 10000)
  
  return `${timestamp}-${randomId}-${processId}`
}

/**
 * Stagger test execution to prevent resource conflicts
 * Each test gets a unique delay based on its worker ID
 * @param page Playwright page object (to get worker info)
 * @param baseDelayMs Base delay in milliseconds (default: 500)
 */
export async function staggerTestExecution(page: any, baseDelayMs: number = 500): Promise<void> {
  // Try to get worker info if available
  let workerId = 0
  try {
    // This is a bit of a hack, but we can use the page context to get some worker info
    const userAgent = await page.evaluate(() => navigator.userAgent)
    const hash = userAgent.split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    workerId = Math.abs(hash) % 10
  } catch {
    workerId = Math.floor(Math.random() * 10)
  }

  // Stagger based on worker ID plus some randomness
  const staggerDelay = baseDelayMs * workerId + Math.random() * 1000
  await new Promise(resolve => setTimeout(resolve, staggerDelay))
}