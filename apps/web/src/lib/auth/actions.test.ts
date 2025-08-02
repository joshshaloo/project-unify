import { describe, it, expect, vi, beforeEach } from 'vitest'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

// Import the actions
import { login, signup, signOut, getUser } from './actions'

// Import test utilities
import { createMockFormData } from '@/test/utils/test-utils'
import { 
  mockUser,
  mockDbUser,
} from '@/test/mocks/supabase'

// Get the mocked versions
const mockCreateClient = vi.mocked(createClient)
const mockRedirect = vi.mocked(redirect)
const mockPrisma = vi.mocked(prisma)

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
    
    // Reset all mocks to default state
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
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: mockUser, session: { access_token: 'mock-token' } },
            error: null,
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: 'test@example.com',
        password: 'password123',
      })

      // Login function redirects on success, so we expect it to throw
      await expect(login(formData)).rejects.toThrow('NEXT_REDIRECT: /dashboard')

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
      const mockSupabase = {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' },
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })

      const result = await login(formData)
      
      expect(result).toEqual({ error: 'Invalid email or password' })
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      })
      expect(mockRedirect).not.toHaveBeenCalled()
    })

    it('should return error for missing email', async () => {
      const formData = createMockFormData({
        email: '',
        password: 'password123',
      })

      const result = await login(formData)

      expect(result).toEqual({ error: 'Invalid email address' })
    })

    it('should return error for missing password', async () => {
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
      const mockSupabase = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: { 
              user: mockUser, 
              session: null // Email confirmation required
            },
            error: null,
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      
      // Mock successful user creation
      mockPrisma.user.create.mockResolvedValue(mockDbUser)

      const formData = createMockFormData({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      })

      // Signup function redirects on success, so we expect it to throw
      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT: /auth/verify-email')

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
      const mockSupabase = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: { 
              user: mockUser, 
              session: null
            },
            error: null,
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      
      // Mock valid invitation
      const mockInvitation = {
        id: 'invite-123',
        token: 'valid-token-123',
        email: 'inviteduser@example.com',
        role: 'assistant_coach',
        clubId: 'club-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: null,
        usedByEmail: null,
        club: { id: 'club-1', name: 'Test FC' },
      }
      mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation)
      mockPrisma.user.create.mockResolvedValue(mockDbUser)

      const formData = createMockFormData({
        email: 'inviteduser@example.com',
        password: 'password123',
        name: 'Invited User',
        invite: 'valid-token-123',
      })

      // Signup function redirects on success, so we expect it to throw
      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT: /auth/verify-email')

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
      mockPrisma.invitation.findUnique.mockResolvedValue(null)

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
      const usedInvitation = {
        id: 'invite-123',
        token: 'used-token',
        email: 'user@example.com',
        role: 'assistant_coach',
        clubId: 'club-1',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        usedAt: new Date('2024-01-01'),
        usedByEmail: 'someone@example.com',
        club: { id: 'club-1', name: 'Test FC' },
      }
      mockPrisma.invitation.findUnique.mockResolvedValue(usedInvitation)

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
      const expiredInvitation = {
        id: 'invite-123',
        token: 'expired-token',
        email: 'user@example.com',
        role: 'assistant_coach',
        clubId: 'club-1',
        expiresAt: new Date('2023-01-01'), // Past date
        usedAt: null,
        usedByEmail: null,
        club: { id: 'club-1', name: 'Test FC' },
      }
      mockPrisma.invitation.findUnique.mockResolvedValue(expiredInvitation)

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

      mockPrisma.invitation.findUnique.mockResolvedValue(invitation)

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
      const mockSupabase = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: { user: null, session: null },
            error: { message: 'User already registered' },
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const formData = createMockFormData({
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      })

      const result = await signup(formData)

      expect(result).toEqual({ error: 'Failed to create account. Please try again.' })
      expect(mockSupabase.auth.signUp).toHaveBeenCalled()
    })

    it('should continue on database error during user creation', async () => {
      const mockSupabase = {
        auth: {
          signUp: vi.fn().mockResolvedValue({
            data: { 
              user: mockUser, 
              session: null
            },
            error: null,
          }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase as any)
      mockPrisma.$transaction.mockRejectedValue(new Error('Database error'))

      const formData = createMockFormData({
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      })

      // Should not throw error, but continue to redirect
      await expect(signup(formData)).rejects.toThrow('NEXT_REDIRECT: /auth/verify-email')

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
      await expect(signOut()).rejects.toThrow('NEXT_REDIRECT: /')

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
      await expect(signOut()).rejects.toThrow('NEXT_REDIRECT: /')

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
      expect(mockRedirect).toHaveBeenCalledWith('/')
    })
  })

  describe('getUser', () => {
    it('should return null when no user is authenticated', async () => {
      const mockSupabase = {
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: null },
            error: null,
          }),
        },
      }
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
      mockPrisma.user.findUnique.mockResolvedValue(null)

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
      mockPrisma.user.findUnique.mockResolvedValue(mockDbUser)

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
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database error'))

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