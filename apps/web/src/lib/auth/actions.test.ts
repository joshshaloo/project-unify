/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import * as magicLinkModule from './magic-link'
import jwt from 'jsonwebtoken'

// Import the actions
import { signIn, registerUser, verifyToken } from './actions'
import { getSession, clearSession } from './magic-link'

// Import test utilities
import { createMockFormData } from '@/test/utils/test-utils'

// Get the mocked versions
const mockRedirect = vi.mocked(redirect)
const mockCookies = vi.mocked(cookies)

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userClub: {
      create: vi.fn(),
    },
    magicLink: {
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

// Import after mocking
import { db } from '@/lib/prisma'
const mockDb = db as any

// Mock modules
vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    getAll: vi.fn(),
    size: 0,
    [Symbol.iterator]: vi.fn(),
  })),
}))

vi.mock('./magic-link', async () => {
  const actual = await vi.importActual('./magic-link')
  return {
    ...actual,
    generateMagicLink: vi.fn().mockResolvedValue('mock-token'),
    verifyMagicLink: vi.fn(),
    createSession: vi.fn().mockResolvedValue('mock-session-token'),
    // Don't mock getSession and clearSession - use real implementations
  }
})

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-jwt-token'),
    verify: vi.fn(() => ({ userId: 'test-user-id' })),
  },
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset all mocks to default state
    mockDb.user.findUnique.mockResolvedValue(null)
    mockDb.user.findFirst.mockResolvedValue(null)
    mockDb.user.create.mockResolvedValue(null)
    mockDb.user.update.mockResolvedValue(null)
    mockDb.invitation.findUnique.mockResolvedValue(null)
    mockDb.invitation.update.mockResolvedValue(null)
    mockDb.userClub.create.mockResolvedValue(null)
    mockDb.magicLink.delete.mockResolvedValue(null)
    mockDb.$transaction.mockImplementation(async (callback: (tx: typeof mockDb) => Promise<any>) => {
      return callback(mockDb)
    })
    
    // Reset magic link mocks
    vi.mocked(magicLinkModule.generateMagicLink).mockReset()
    vi.mocked(magicLinkModule.generateMagicLink).mockResolvedValue('mock-token')
    vi.mocked(magicLinkModule.verifyMagicLink).mockReset()
    vi.mocked(magicLinkModule.createSession).mockReset()
    vi.mocked(magicLinkModule.createSession).mockResolvedValue('mock-session-token')
  })

  describe('signIn', () => {
    it('should successfully send magic link for existing user', async () => {
      const formData = createMockFormData({
        email: 'test@example.com',
      })

      const result = await signIn(null, formData)

      expect(magicLinkModule.generateMagicLink).toHaveBeenCalledWith('test@example.com')
      expect(result).toEqual({ 
        success: true, 
        message: 'Check your email for a magic link to sign in!' 
      })
    })

    it('should return error for invalid email', async () => {
      const formData = createMockFormData({
        email: 'invalid-email',
      })

      const result = await signIn(null, formData)

      expect(result).toEqual({ error: 'Invalid email address' })
      expect(magicLinkModule.generateMagicLink).not.toHaveBeenCalled()
    })

    it('should handle magic link generation errors', async () => {
      vi.mocked(magicLinkModule.generateMagicLink).mockRejectedValue(new Error('Email service error'))

      const formData = createMockFormData({
        email: 'test@example.com',
      })

      const result = await signIn(null, formData)

      expect(result).toEqual({ error: 'Failed to send magic link' })
    })
  })

  describe('registerUser', () => {
    it('should successfully send magic link for registration', async () => {

      const formData = createMockFormData({
        email: 'newuser@example.com',
        name: 'New User',
      })

      const result = await registerUser(null, formData)

      expect(magicLinkModule.generateMagicLink).toHaveBeenCalledWith('newuser@example.com')
      expect(result).toEqual({ 
        success: true, 
        message: 'Check your email to complete registration!' 
      })
    })

    it('should send magic link even if user already exists', async () => {
      // The registerUser function doesn't check if user exists
      // It just sends a magic link

      const formData = createMockFormData({
        email: 'existing@example.com',
        name: 'Test User',
      })

      const result = await registerUser(null, formData)

      expect(result).toEqual({ 
        success: true,
        message: 'Check your email to complete registration!' 
      })
      expect(magicLinkModule.generateMagicLink).toHaveBeenCalledWith('existing@example.com')
    })

    it('should validate required fields', async () => {
      const formData = createMockFormData({
        email: 'invalid-email',
        name: 'Test User',
      })

      const result = await registerUser(null, formData)

      expect(result).toEqual({ error: 'Invalid email address' })
    })

    it('should handle magic link generation errors', async () => {
      vi.mocked(magicLinkModule.generateMagicLink).mockRejectedValue(new Error('Email error'))

      const formData = createMockFormData({
        email: 'newuser@example.com',
        name: 'New User',
      })

      const result = await registerUser(null, formData)

      expect(result).toEqual({ error: 'Failed to send magic link' })
    })
  })

  describe('verifyToken', () => {
    it('should successfully verify token and create session', async () => {
      const mockResult = {
        email: 'test@example.com',
        userId: 'user-123'
      }
      
      vi.mocked(magicLinkModule.verifyMagicLink).mockResolvedValue(mockResult)
      
      // Mock getRegistrationIntent to return null (no registration intent)
      const getRegistrationIntent = vi.fn().mockResolvedValue(null)
      vi.stubGlobal('getRegistrationIntent', getRegistrationIntent)

      // verifyToken redirects on success, so we expect it to throw
      await expect(verifyToken('valid-token')).rejects.toThrow('NEXT_REDIRECT: /dashboard')

      expect(magicLinkModule.verifyMagicLink).toHaveBeenCalledWith('valid-token')
      expect(magicLinkModule.createSession).toHaveBeenCalledWith('user-123', 'test@example.com')
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle registration intent and create club', async () => {
      const mockResult = {
        email: 'test@example.com',
        userId: 'user-123'
      }
      
      vi.mocked(magicLinkModule.verifyMagicLink).mockResolvedValue(mockResult)

      // Setup transaction mocks
      const mockClub = { id: 'club-123', name: 'Test Club FC' }
      mockDb.$transaction.mockImplementation(async (fn: any) => {
        await fn({
          user: { update: vi.fn() },
          club: { create: vi.fn().mockResolvedValue(mockClub) },
          userClub: { create: vi.fn() }
        })
      })

      await expect(verifyToken('valid-token')).rejects.toThrow('NEXT_REDIRECT: /dashboard')

      expect(magicLinkModule.verifyMagicLink).toHaveBeenCalledWith('valid-token')
      expect(magicLinkModule.createSession).toHaveBeenCalledWith('user-123', 'test@example.com')
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
    })

    it('should return error for invalid token', async () => {
      vi.mocked(magicLinkModule.verifyMagicLink).mockResolvedValue(null)

      const result = await verifyToken('invalid-token')

      expect(result).toEqual({ error: 'Invalid or expired link' })
      expect(mockDb.user.findUnique).not.toHaveBeenCalled()
    })

    it('should handle verifyMagicLink errors', async () => {
      vi.mocked(magicLinkModule.verifyMagicLink).mockRejectedValue(new Error('Database error'))

      const result = await verifyToken('valid-token')

      expect(result).toEqual({ error: 'Invalid or expired link' })
    })
  })

  describe('clearSession', () => {
    it('should successfully clear session', async () => {
      const mockCookieStore = {
        set: vi.fn(),
        get: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
        size: 0,
        [Symbol.iterator]: vi.fn(),
      }
      mockCookies.mockResolvedValueOnce(mockCookieStore as any)

      await clearSession()

      expect(mockCookieStore.delete).toHaveBeenCalledWith('session')
    })
  })

  describe('getSession', () => {
    it('should return null when no session cookie', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(null),
        set: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
        size: 0,
        [Symbol.iterator]: vi.fn(),
      }
      mockCookies.mockResolvedValueOnce(mockCookieStore as any)

      const session = await getSession()

      expect(session).toBeNull()
    })

    it('should return session data when valid session', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: 'valid-jwt-token' }),
        set: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
        size: 0,
        [Symbol.iterator]: vi.fn(),
      }
      mockCookies.mockResolvedValueOnce(mockCookieStore as any)
      
      vi.mocked(jwt.verify).mockReturnValue({ userId: 'user-123', email: 'test@example.com' } as any)

      const session = await getSession()

      expect(jwt.verify).toHaveBeenCalledWith('valid-jwt-token', process.env.NEXTAUTH_SECRET)
      expect(session).toEqual({ userId: 'user-123', email: 'test@example.com' })
    })

    it('should return null for invalid JWT', async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: 'invalid-jwt' }),
        set: vi.fn(),
        delete: vi.fn(),
        has: vi.fn(),
        getAll: vi.fn(),
        size: 0,
        [Symbol.iterator]: vi.fn(),
      }
      mockCookies.mockResolvedValueOnce(mockCookieStore as any)
      
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token')
      })

      const session = await getSession()

      expect(session).toBeNull()
    })
  })
})