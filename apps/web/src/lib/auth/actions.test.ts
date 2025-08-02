import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock modules first before any imports
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

// Now import the actions and mocks
import { login, signup, signOut, getUser } from './actions'
import { 
  mockSuccessfulLogin, 
  mockFailedLogin,
  mockSuccessfulSignup,
  mockFailedSignup,
  mockNoUser,
  mockUser,
  mockDbUser,
  createMockSupabaseClient
} from '@/test/mocks/supabase'
import { 
  mockPrisma,
  mockSuccessfulUserLookup,
  mockSuccessfulUserCreation,
  mockValidInvitation,
  mockUsedInvitation,
  mockExpiredInvitation,
  mockInvalidInvitation,
  mockNoUser as mockPrismaNoUser,
  mockDatabaseError
} from '@/test/mocks/prisma'
import { createMockFormData } from '@/test/utils/test-utils'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// Get reference to the mocked createClient function
const mockCreateClient = vi.mocked(createClient)

// Mock Next.js functions
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

describe('Auth Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset Prisma mocks
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue(null as any)
    mockPrisma.invitation.findUnique.mockResolvedValue(null)
    mockPrisma.invitation.update.mockResolvedValue(null as any)
    mockPrisma.userClub.create.mockResolvedValue(null as any)
    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return callback(mockPrisma)
    })
    // Don't set a default implementation for createClient - let tests handle it
  })

  describe('login', () => {
    it('should successfully log in a user with valid credentials', async () => {
      const mockSupabase = mockSuccessfulLogin()
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: 'test@example.com',
        password: 'password123',
      })

      await login(formData)

      // Check if mockCreateClient was called
      expect(mockCreateClient).toHaveBeenCalled()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/dashboard')
    })

    it('should return error for invalid credentials', async () => {
      const mockSupabase = mockFailedLogin('Invalid login credentials')
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })

      const result = await login(formData)

      expect(result).toEqual({ error: 'Invalid login credentials' })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })
      expect(redirect).not.toHaveBeenCalled()
    })

    it('should return error for missing email', async () => {
      const mockSupabase = mockFailedLogin('Email is required')
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: '',
        password: 'password123',
      })

      const result = await login(formData)

      expect(result).toEqual({ error: 'Email is required' })
    })

    it('should return error for missing password', async () => {
      const mockSupabase = mockFailedLogin('Password is required')
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: 'test@example.com',
        password: '',
      })

      const result = await login(formData)

      expect(result).toEqual({ error: 'Password is required' })
    })
  })

  describe('signup', () => {
    it('should successfully sign up a user without invitation', async () => {
      const mockSupabase = mockSuccessfulSignup()
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      
      // Mock Prisma for user creation
      mockSuccessfulUserCreation()

      const formData = createMockFormData({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      })

      await signup(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/auth/verify-email')
    })

    it('should successfully sign up a user with valid invitation', async () => {
      const mockSupabase = mockSuccessfulSignup()
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      
      // Mock Prisma with valid invitation
      mockValidInvitation()
      mockSuccessfulUserCreation()

      const formData = createMockFormData({
        email: 'inviteduser@example.com',
        password: 'password123',
        name: 'Invited User',
        invite: 'valid-token-123',
      })

      await signup(formData)

      expect(mockPrisma.invitation.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token-123' },
        include: { club: true },
      })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'inviteduser@example.com',
        password: 'password123',
      })
      expect(redirect).toHaveBeenCalledWith('/auth/verify-email')
    })

    it('should return error for invalid invitation token', async () => {
      mockInvalidInvitation()

      const formData = createMockFormData({
        email: 'user@example.com',
        password: 'password123',
        invite: 'invalid-token',
      })

      const result = await signup(formData)

      expect(result).toEqual({ error: 'Invalid invitation token' })
      expect(mockPrisma.invitation.findUnique).toHaveBeenCalledWith({
        where: { token: 'invalid-token' },
        include: { club: true },
      })
    })

    it('should return error for used invitation', async () => {
      mockUsedInvitation()

      const formData = createMockFormData({
        email: 'user@example.com',
        password: 'password123',
        invite: 'used-token',
      })

      const result = await signup(formData)

      expect(result).toEqual({ error: 'This invitation has already been used' })
    })

    it('should return error for expired invitation', async () => {
      mockExpiredInvitation()

      const formData = createMockFormData({
        email: 'user@example.com',
        password: 'password123',
        invite: 'expired-token',
      })

      const result = await signup(formData)

      expect(result).toEqual({ error: 'This invitation has expired' })
    })

    it('should return error when invitation email does not match signup email', async () => {
      const invitation = {
        id: 'invite-123',
        token: 'valid-token-123',
        email: 'specific@example.com',
        role: 'assistant_coach',
        clubId: 'club-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        usedByEmail: null,
        club: { id: 'club-1', name: 'Test FC' },
      }

      mockPrisma.invitation.findUnique = vi.fn().mockResolvedValue(invitation)

      const formData = createMockFormData({
        email: 'different@example.com',
        password: 'password123',
        invite: 'valid-token-123',
      })

      const result = await signup(formData)

      expect(result).toEqual({ error: 'This invitation is for a different email address' })
    })

    it('should return error for Supabase signup failure', async () => {
      const mockSupabase = mockFailedSignup('User already registered')
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockValidInvitation()

      const formData = createMockFormData({
        email: 'existing@example.com',
        password: 'password123',
      })

      const result = await signup(formData)

      expect(result).toEqual({ error: 'User already registered' })
      expect(mockSupabase.auth.signUp).toHaveBeenCalled()
    })

    it('should continue on database error during user creation', async () => {
      const mockSupabase = mockSuccessfulSignup()
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockDatabaseError()

      const formData = createMockFormData({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      })

      // Should not throw error, but continue to redirect
      await signup(formData)

      expect(mockSupabase.auth.signUp).toHaveBeenCalled()
      expect(redirect).toHaveBeenCalledWith('/auth/verify-email')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out user', async () => {
      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockResolvedValue({ error: null }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      await signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/')
    })

    it('should handle sign out even if Supabase fails', async () => {
      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      // Should not throw error
      await signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(redirect).toHaveBeenCalledWith('/')
    })
  })

  describe('getUser', () => {
    it('should return null when no user is authenticated', async () => {
      const mockSupabase = mockNoUser()
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const user = await getUser()

      expect(user).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('should return null when user exists in Supabase but not in database', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockPrismaNoUser()

      const user = await getUser()

      expect(user).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { supabaseId: mockUser.id },
        include: {
          clubs: {
            include: {
              club: true,
            },
          },
        },
      })
    })

    it('should return full user data when authenticated and exists in database', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockSuccessfulUserLookup()

      const user = await getUser()

      expect(user).toEqual(mockDbUser)
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { supabaseId: mockUser.id },
        include: {
          clubs: {
            include: {
              club: true,
            },
          },
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: mockUser },
            error: null,
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockPrisma.user.findUnique = vi.fn().mockRejectedValue(new Error('Database error'))

      const user = await getUser()

      expect(user).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })

    it('should handle Supabase errors gracefully', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: { message: 'Network error' },
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const user = await getUser()

      expect(user).toBeNull()
      expect(mockSupabase.auth.getUser).toHaveBeenCalled()
    })
  })
})