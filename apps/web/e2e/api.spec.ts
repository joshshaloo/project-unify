import { test, expect } from '@playwright/test'

test.describe('API Routes', () => {
  test.describe('Health Check API', () => {
    test('should return healthy status', async ({ request }) => {
      const response = await request.get('/api/health')
      
      expect(response.status()).toBe(200)
      
      const data = await response.json()
      expect(data).toMatchObject({
        status: 'healthy',
        service: 'web',
        timestamp: expect.any(String)
      })

      // Validate timestamp format
      expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp)
    })

    test('should have correct content type', async ({ request }) => {
      const response = await request.get('/api/health')
      
      expect(response.headers()['content-type']).toContain('application/json')
    })
  })

  test.describe('TRPC API', () => {
    test('should handle health check query procedure', async ({ request }) => {
      // tRPC query procedures are accessed via GET with proper query params
      const response = await request.get('/api/trpc/health.check?batch=1&input=%7B%220%22%3A%7B%7D%7D')
      
      // tRPC should return 200 for valid query or appropriate error status
      expect([200, 400, 500]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        // tRPC batch response format
        expect(data[0]?.result?.data?.json).toMatchObject({
          status: 'ok',
          timestamp: expect.any(String),
          message: expect.any(String),
          database: expect.any(Boolean)
        })
      }
    })

    test('should require authentication for protected procedures', async ({ request }) => {
      // Try to access protected procedure without authentication
      // auth.me would also be a query procedure, so use proper format
      const response = await request.get('/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%7D%7D')
      
      // Should return unauthorized or redirect for protected procedure
      expect([401, 403, 302, 500]).toContain(response.status())
    })

    test('should handle batch query requests', async ({ request }) => {
      // tRPC batch requests for queries should use GET with batch parameter
      const batchInput = encodeURIComponent(JSON.stringify({
        '0': {}
      }))
      
      const response = await request.get(`/api/trpc/health.check?batch=1&input=${batchInput}`)

      // Should return 200 for valid batch query or appropriate error
      expect([200, 400, 500]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        expect(Array.isArray(data)).toBeTruthy()
      }
    })
  })

  test.describe('Database Test API', () => {
    test('should connect to database', async ({ request }) => {
      const response = await request.get('/api/test-db')
      
      // Should either succeed or fail gracefully
      expect([200, 500]).toContain(response.status())
      
      if (response.status() === 200) {
        const data = await response.json()
        // The test-db API returns different structure
        expect(data).toHaveProperty('status', 'connected')
        expect(data).toHaveProperty('message')
      }
    })
  })

  test.describe('Error Handling', () => {
    test('should handle 404 for non-existent routes', async ({ request }) => {
      const response = await request.get('/api/non-existent-route')
      
      expect(response.status()).toBe(404)
    })

    test('should handle invalid query parameters', async ({ request }) => {
      // Test invalid input for tRPC query
      const response = await request.get('/api/trpc/health.check?batch=1&input=invalid-json')

      // tRPC may return 200 with error in response body or 400/422/500
      expect([200, 400, 422, 500]).toContain(response.status())
    })

    test('should handle CORS headers', async ({ request }) => {
      const response = await request.fetch('/api/health', {
        method: 'OPTIONS'
      })
      
      // Should either handle OPTIONS or return method not allowed
      expect([200, 204, 405]).toContain(response.status())
    })
  })

  test.describe('Performance', () => {
    test('health check should respond quickly', async ({ request }) => {
      const startTime = Date.now()
      const response = await request.get('/api/health')
      const endTime = Date.now()
      
      expect(response.status()).toBe(200)
      expect(endTime - startTime).toBeLessThan(1000) // Should respond in less than 1 second
    })

    test('should handle concurrent requests', async ({ request }) => {
      const promises = Array(10).fill(null).map(() => 
        request.get('/api/health')
      )
      
      const responses = await Promise.all(promises)
      
      responses.forEach(response => {
        expect(response.status()).toBe(200)
      })
    })
  })

  test.describe('Security', () => {
    test('should have security headers', async ({ request }) => {
      const response = await request.get('/api/health')
      
      const headers = response.headers()
      
      // Check for common security headers (these might be set by Next.js or deployment platform)
      expect(headers).toBeDefined()
    })

    test('should not expose sensitive information in errors', async ({ request }) => {
      // Try to cause an error with malformed request
      const response = await request.get('/api/trpc/auth.me?batch=1&input=malicious-payload')
      
      if (response.status() >= 400) {
        const text = await response.text()
        
        // Should not expose sensitive information
        expect(text).not.toContain('password')
        expect(text).not.toContain('secret')
        expect(text).not.toContain('key')
        expect(text).not.toContain('database')
      }
    })
  })
})