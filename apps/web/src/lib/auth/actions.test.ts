import { describe, it, expect, vi, beforeEach } from 'vitest'

// Import the actions and mocks
import { login, signup, signOut, getUser } from './actions'
import { 
  mockSuccessfulLogin, 
  mockFailedLogin,
  mockSuccessfulSignup,
  mockFailedSignup,
  mockNoUser,
  mockUser,
  mockDbUser
} from '@/test/mocks/supabase'
import { createClient } from '@/lib/supabase/server'

// Get the mocked versions
const mockCreateClient = vi.mocked(createClient)
const mockRedirect = vi.mocked(redirect)
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

// Mock Next.js functions - redirect throws an error in Next.js
vi.mock('next/navigation', () => ({
  redirect: vi.fn().mockImplementation((url) => {
    throw new Error(`NEXT_REDIRECT: ${url}`)
  }),
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
    // Reset createClient mock to default
    mockCreateClient.mockResolvedValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      },
    } as any)
  })

  describe('login', () => {
    it('should successfully log in a user with valid credentials', async () => {
      const mockSupabase = mockSuccessfulLogin()
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: 'test@example.com',
        password: 'password123',
      })

      // Login function redirects on success, so we expect it to throw
      try {
        await login(formData)
      } catch (error) {
        // redirect() throws an error in Next.js
      }

      // Check if mockCreateClient was called
      expect(mockCreateClient).toHaveBeenCalled()
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(mockRedirect).toHaveBeenCalledWith('/dashboard')
    })

    it('should return error for invalid credentials', async () => {
      const mockSupabase = mockFailedLogin('Invalid login credentials')
      mockCreateClient.mockResolvedValueOnce(mockSupabase as any)

      const formData = createMockFormData({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })

      // Test may redirect, catch it
      let result
      try {
        result = await login(formData)
      } catch (error) {
        // If it throws a redirect, the result should have been returned before
      }

      console.log('Result:', result)
      console.log('Mock called:', mockCreateClient.mock.calls.length)
      console.log('Mock implementation:', mockCreateClient.getMockImplementation())
      console.log('mockSupabase auth:', mockSupabase.auth.signInWithPassword.mock.calls.length)
      
      expect(result).toEqual({ error: 'Invalid email or password' })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return error for missing email', async () => {
      const mockSupabase = mockFailedLogin('Email is required')
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: '',
        password: 'password123',
      })

      const result = await login(formData)

      expect(result).toEqual({ error: 'Invalid email address' })
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
        invite: undefined,
      })

      // Signup function redirects on success, so we expect it to throw
      try {
        await signup(formData)
      } catch (error) {
        // redirect() throws an error in Next.js
      }

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'New User',
          }
        }
      })
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(mockRedirect).toHaveBeenCalledWith('/auth/verify-email')
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

      // Signup function redirects on success, so we expect it to throw
      try {
        await signup(formData)
      } catch (error) {
        // redirect() throws an error in Next.js
      }

      expect(mockPrisma.invitation.findUnique).toHaveBeenCalledWith({
        where: { token: 'valid-token-123' },
        include: { club: true },
      })
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'inviteduser@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Invited User',
          }
        }
      })
      expect(mockRedirect).toHaveBeenCalledWith('/auth/verify-email')
    })

    it('should return error for invalid invitation token', async () => {
      mockInvalidInvitation()

      const formData = createMockFormData({
        email: 'user@example.com',
        password: 'password123',
        name: 'Test User',
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
        name: 'Test User',
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
        name: 'Test User',
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
        name: 'Test User',
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
        name: 'Test User',
        invite: undefined,
      })

      const result = await signup(formData)

      expect(result).toEqual({ error: 'Failed to create account. Please try again.' })
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
        invite: undefined,
      })

      // Should not throw error, but continue to redirect
      try {
        await signup(formData)
      } catch (error) {
        // redirect() throws an error in Next.js
      }

      expect(mockSupabase.auth.signUp).toHaveBeenCalled()
      expect(mockRedirect).toHaveBeenCalledWith('/auth/verify-email')
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

      // SignOut function redirects, so we expect it to throw
      try {
        await signOut()
      } catch (error) {
        // redirect() throws an error in Next.js
      }

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })

    it('should handle sign out even if Supabase fails', async () => {
      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      // SignOut function redirects, so we expect it to throw
      try {
        await signOut()
      } catch (error) {
        // redirect() throws an error in Next.js
      }

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(mockRedirect).toHaveBeenCalledWith('/')
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