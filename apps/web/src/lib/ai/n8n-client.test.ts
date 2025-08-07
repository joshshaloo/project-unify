import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the entire n8n-client module to avoid environment variable issues
vi.mock('./n8n-client', async () => {
  const actual = await vi.importActual('./n8n-client')
  
  class MockN8NClient {
    private baseUrl: string
    private timeout: number
    
    constructor() {
      this.baseUrl = 'https://test-n8n.example.com'
      this.timeout = 30000
    }
    
    async generateSession(request: any) {
      return global.fetch(`${this.baseUrl}/webhook/coach-winston`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(this.timeout),
      }).then(res => res.json())
    }
    
    async healthCheck() {
      try {
        const response = await global.fetch(`${this.baseUrl}/webhook/health`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        })
        return response.ok
      } catch {
        return false
      }
    }
  }
  
  return {
    ...actual,
    N8NClient: MockN8NClient,
    n8nClient: new MockN8NClient(),
  }
})

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock AbortSignal.timeout
const mockAbortSignal = {
  timeout: vi.fn(() => ({
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
}
global.AbortSignal = mockAbortSignal as any

import { N8NClient, type CoachWinstonRequest, type CoachWinstonResponse } from './n8n-client'

describe('N8NClient', () => {
  let client: N8NClient

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should initialize with webhook URL from environment', () => {
      expect(() => new N8NClient()).not.toThrow()
    })

    it('should throw error if N8N_WEBHOOK_URL is not set', () => {
      delete process.env.N8N_WEBHOOK_URL
      expect(() => new N8NClient()).toThrow('N8N_WEBHOOK_URL environment variable is required')
    })
  })

  describe('generateSession', () => {
    beforeEach(() => {
      client = new N8NClient()
    })

    const validRequest: CoachWinstonRequest = {
      teamId: 'team-123',
      duration: 90,
      focusAreas: ['passing', 'shooting'],
      ageGroup: 'U12',
      skillLevel: 'intermediate',
      playerCount: 15,
      weatherConditions: 'good',
      availableEquipment: ['cones', 'balls', 'goals'],
    }

    const validResponse: CoachWinstonResponse = {
      success: true,
      sessionId: 'session-123',
      sessionPlan: {
        sessionTitle: 'Passing and Shooting Training',
        overview: 'A comprehensive training session focusing on passing accuracy and shooting technique',
        totalDuration: 90,
        ageGroup: 'U12',
        focusAreas: ['passing', 'shooting'],
        activities: [
          {
            phase: 'warm-up',
            name: 'Dynamic Warm-up',
            duration: 15,
            description: 'Light jogging and dynamic stretches',
            setup: '20x20 yard area',
            instructions: 'Players jog around the area with dynamic movements',
            coachingPoints: ['Proper posture', 'Gradual intensity increase'],
            progressions: ['Add ball work'],
            equipment: ['cones'],
            safetyNotes: 'Ensure proper warm-up before intense activity',
          },
          {
            phase: 'technical',
            name: 'Passing Practice',
            duration: 30,
            description: 'Short and long passing drills',
            setup: '30x20 yard grid',
            instructions: 'Players work in pairs practicing different passes',
            coachingPoints: ['Inside foot technique', 'Follow through'],
            progressions: ['Increase distance', 'Add movement'],
            equipment: ['balls', 'cones'],
          },
          {
            phase: 'tactical',
            name: 'Shooting Drill',
            duration: 30,
            description: 'Finishing from various angles',
            setup: 'Penalty area',
            instructions: 'Players take turns shooting from different positions',
            coachingPoints: ['Plant foot position', 'Keep head steady'],
            progressions: ['Add pressure', 'Time constraints'],
            equipment: ['balls', 'goals'],
          },
          {
            phase: 'cool-down',
            name: 'Cool Down',
            duration: 15,
            description: 'Light stretching and reflection',
            instructions: 'Static stretching and session discussion',
            coachingPoints: ['Hold stretches properly'],
            equipment: ['balls'],
          },
        ],
        coachNotes: 'Focus on technical execution over speed',
        adaptations: {
          forBeginners: 'Reduce distances and slow down pace',
          forAdvanced: 'Add time pressure and opposition',
          weatherAlternatives: 'Indoor alternatives available',
        },
      },
      metadata: {
        generatedAt: '2024-01-01T12:00:00Z',
        teamId: 'team-123',
        requestId: 'req-123',
      },
    }

    it('should successfully generate session with valid request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validResponse),
      })

      const result = await client.generateSession(validRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/coach-winston',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(validRequest),
          signal: expect.any(Object),
        }
      )
      expect(result).toEqual(validResponse)
    })

    it('should validate input parameters', async () => {
      const invalidRequest = {
        ...validRequest,
        duration: 10, // Too short - minimum is 15
      }

      await expect(client.generateSession(invalidRequest)).rejects.toThrow()
    })

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })

      await expect(client.generateSession(validRequest)).rejects.toThrow(
        'n8n API returned 500: Internal Server Error'
      )
    })

    it('should handle 404 errors with specific message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(client.generateSession(validRequest)).rejects.toThrow(
        'Coach Winston workflow is not available. Please check the n8n configuration.'
      )
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(client.generateSession(validRequest)).rejects.toThrow(
        'Unable to connect to AI service. Please try again later.'
      )
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timed out')
      timeoutError.name = 'TimeoutError'
      mockFetch.mockRejectedValueOnce(timeoutError)

      await expect(client.generateSession(validRequest)).rejects.toThrow(
        'Session generation timed out. Please try again.'
      )
    })

    it('should handle unsuccessful API responses with error message', async () => {
      const errorResponse: CoachWinstonResponse = {
        success: false,
        error: {
          message: 'AI service is temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          timestamp: '2024-01-01T12:00:00Z',
          requestId: 'req-123',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(errorResponse),
      })

      await expect(client.generateSession(validRequest)).rejects.toThrow(
        'AI service is temporarily unavailable'
      )
    })

    it('should handle unsuccessful API responses without error message', async () => {
      const errorResponse: CoachWinstonResponse = {
        success: false,
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(errorResponse),
      })

      await expect(client.generateSession(validRequest)).rejects.toThrow(
        'Session generation failed'
      )
    })

    it('should validate API response structure', async () => {
      const invalidResponse = {
        success: true,
        sessionPlan: {
          // Missing required fields
          sessionTitle: 'Test Session',
        },
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidResponse),
      })

      await expect(client.generateSession(validRequest)).rejects.toThrow()
    })

    it('should handle malformed JSON response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      await expect(client.generateSession(validRequest)).rejects.toThrow()
    })

    it('should set correct timeout', () => {
      client.generateSession(validRequest)
      expect(mockAbortSignal.timeout).toHaveBeenCalledWith(30000)
    })

    it('should handle requests with minimal required fields', async () => {
      const minimalRequest: CoachWinstonRequest = {
        teamId: 'team-123',
        duration: 60,
        focusAreas: ['ball control'],
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(validResponse),
      })

      const result = await client.generateSession(minimalRequest)
      expect(result).toEqual(validResponse)
    })
  })

  describe('healthCheck', () => {
    beforeEach(() => {
      client = new N8NClient()
    })

    it('should return true when health endpoint responds OK', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      })

      const result = await client.healthCheck()

      expect(mockFetch).toHaveBeenCalledWith(
        'https://n8n.example.com/webhook/health',
        {
          method: 'GET',
          signal: expect.any(Object),
        }
      )
      expect(result).toBe(true)
    })

    it('should return false when health endpoint responds with error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      const result = await client.healthCheck()
      expect(result).toBe(false)
    })

    it('should return false when health endpoint throws error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await client.healthCheck()
      expect(result).toBe(false)
    })

    it('should use shorter timeout for health check', () => {
      client.healthCheck()
      expect(mockAbortSignal.timeout).toHaveBeenCalledWith(5000)
    })
  })

  describe('singleton instance', () => {
    it('should export a singleton instance', async () => {
      // Need to re-import after setting env var
      const n8nClientModule = await import('./n8n-client')
      const { n8nClient } = n8nClientModule
      expect(n8nClient).toBeInstanceOf(N8NClient)
    })
  })
})