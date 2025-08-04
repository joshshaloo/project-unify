import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { GET } from './route'

describe('/api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date to have consistent timestamps in tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    // Mock npm_package_version for tests
    process.env.npm_package_version = '0.1.0'
  })

  afterEach(() => {
    vi.useRealTimers()
    delete process.env.npm_package_version
  })

  it('should return health check response', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toEqual({
      status: 'healthy',
      service: 'web',
      timestamp: '2024-01-01T00:00:00.000Z',
      version: '0.1.0',
      environment: 'test'
    })
  })

  it('should have correct response headers', async () => {
    const response = await GET()
    
    expect(response.headers.get('content-type')).toContain('application/json')
  })

  it('should return different timestamps on multiple calls', async () => {
    const response1 = await GET()
    const data1 = await response1.json()

    // Advance time by 1 second
    vi.advanceTimersByTime(1000)

    const response2 = await GET()
    const data2 = await response2.json()

    expect(data1.timestamp).not.toBe(data2.timestamp)
    expect(new Date(data2.timestamp).getTime()).toBeGreaterThan(new Date(data1.timestamp).getTime())
  })

  it('should always return status healthy', async () => {
    // Test multiple calls to ensure consistency
    for (let i = 0; i < 5; i++) {
      const response = await GET()
      const data = await response.json()
      
      expect(data.status).toBe('healthy')
      expect(data.service).toBe('web')
      expect(data.version).toBe('0.1.0')
      expect(data.environment).toBe('test')
    }
  })

  it('should have valid ISO timestamp format', async () => {
    const response = await GET()
    const data = await response.json()

    // Check if timestamp is valid ISO string
    const timestamp = new Date(data.timestamp)
    expect(timestamp.toISOString()).toBe(data.timestamp)
    expect(timestamp.getTime()).not.toBeNaN()
  })
})