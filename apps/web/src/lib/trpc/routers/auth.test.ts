import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockTRPCContext } from '@/test/utils/test-utils'
import { TRPCError } from '@trpc/server'
import { createTestUser, createTestClub, createTestUserClub } from '@/test/factories'

// Use the shared mock from setup

// Import after mocking
import { authRouter } from './auth'
import { mockCreateClient } from '@/test/mocks/supabase'

describe('Auth Router', () => {
  let ctx: any
  let caller: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Create a fresh context for each test
    ctx = createMockTRPCContext()
    caller = authRouter.createCaller(ctx)
  })

  describe('me', () => {
    it('should return current user', async () => {
      const testUser = createTestUser()
      ctx.user = testUser

      const result = await caller.me()

      expect(result).toEqual(testUser)
    })

    it('should throw UNAUTHORIZED when user is not authenticated', async () => {
      ctx.user = null

      await expect(caller.me()).rejects.toThrow(TRPCError)
      await expect(caller.me()).rejects.toThrow('You must be logged in to access this resource')
    })
  })

  describe('updateProfile', () => {
    it('should update user profile with valid input', async () => {
      const testUser = createTestUser()
      const updatedUser = { ...testUser, name: 'Updated Name' }
      
      ctx.user = testUser
      ctx.prisma.user.update = vi.fn().mockResolvedValue(updatedUser)

      const result = await caller.updateProfile({
        name: 'Updated Name',
      })

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: { name: 'Updated Name' },
      })
      expect(result).toEqual(updatedUser)
    })

    it('should update notification settings', async () => {
      const testUser = createTestUser()
      const notificationSettings = { email: true, push: false }
      const updatedUser = { ...testUser, notificationSettings }

      ctx.user = testUser
      ctx.prisma.user.update = vi.fn().mockResolvedValue(updatedUser)

      const result = await caller.updateProfile({
        notificationSettings,
      })

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: { notificationSettings },
      })
      expect(result).toEqual(updatedUser)
    })

    it('should update preferred language', async () => {
      const testUser = createTestUser()
      const updatedUser = { ...testUser, preferredLanguage: 'es' }

      ctx.user = testUser
      ctx.prisma.user.update = vi.fn().mockResolvedValue(updatedUser)

      const result = await caller.updateProfile({
        preferredLanguage: 'es',
      })

      expect(ctx.prisma.user.update).toHaveBeenCalledWith({
        where: { id: testUser.id },
        data: { preferredLanguage: 'es' },
      })
      expect(result).toEqual(updatedUser)
    })

    it('should reject invalid input', async () => {
      const testUser = createTestUser()
      ctx.user = testUser

      await expect(caller.updateProfile({
        name: '', // Empty name should fail validation
      })).rejects.toThrow()
    })

    it('should handle database errors', async () => {
      const testUser = createTestUser()
      ctx.user = testUser
      ctx.prisma.user.update = vi.fn().mockRejectedValue(new Error('Database error'))

      await expect(caller.updateProfile({
        name: 'Updated Name',
      })).rejects.toThrow('Database error')
    })
  })

  describe('completeOnboarding', () => {
    it('should complete onboarding with new club creation', async () => {
      const testUser = createTestUser({ onboardingCompleted: false })
      const testClub = createTestClub({ name: 'New Club FC' })
      
      ctx.user = testUser
      
      // Mock transaction
      const mockTransaction = vi.fn().mockImplementation(async (callback) => {
        const tx = {
          user: {
            update: vi.fn().mockResolvedValue({
              ...testUser,
              name: 'John Doe',
              onboardingCompleted: true,
            }),
          },
          club: {
            create: vi.fn().mockResolvedValue(testClub),
          },
          userClub: {
            create: vi.fn().mockResolvedValue(createTestUserClub({
              userId: testUser.id,
              clubId: testClub.id,
              role: 'head_coach',
            })),
          },
        }
        return callback(tx)
      })
      
      ctx.prisma.$transaction = mockTransaction

      const result = await caller.completeOnboarding({
        name: 'John Doe',
        role: 'head_coach',
        clubName: 'New Club FC',
      })

      expect(mockTransaction).toHaveBeenCalled()
      expect(result.onboardingCompleted).toBe(true)
    })

    it('should reject when trying to join with invite code (not implemented)', async () => {
      const testUser = createTestUser({ onboardingCompleted: false })
      ctx.user = testUser

      await expect(caller.completeOnboarding({
        name: 'John Doe',
        role: 'parent',
        inviteCode: 'INVITE123',
      })).rejects.toThrow('Invite codes not yet implemented')
    })

    it('should validate required fields', async () => {
      const testUser = createTestUser()
      ctx.user = testUser

      // Missing name
      await expect(caller.completeOnboarding({
        name: '',
        role: 'head_coach',
        clubName: 'Test Club',
      })).rejects.toThrow()

      // Invalid role
      await expect(caller.completeOnboarding({
        name: 'John Doe',
        role: 'invalid_role' as any,
        clubName: 'Test Club',
      })).rejects.toThrow()

      // Missing club name and invite code
      await expect(caller.completeOnboarding({
        name: 'John Doe',
        role: 'head_coach',
      })).rejects.toThrow()
    })

    it('should handle transaction failures', async () => {
      const testUser = createTestUser()
      ctx.user = testUser
      ctx.prisma.$transaction = vi.fn().mockRejectedValue(new Error('Transaction failed'))

      await expect(caller.completeOnboarding({
        name: 'John Doe',
        role: 'head_coach',
        clubName: 'Test Club',
      })).rejects.toThrow('Transaction failed')
    })
  })

  describe('myClubs', () => {
    it('should return user clubs with related data', async () => {
      const testUser = createTestUser()
      const testClub = createTestClub()
      const testUserClub = createTestUserClub({
        userId: testUser.id,
        clubId: testClub.id,
      })

      const mockClubs = [{
        ...testUserClub,
        club: {
          ...testClub,
          teams: [],
          _count: {
            userClubs: 5,
            teams: 2,
            sessions: 10,
          },
        },
      }]

      ctx.user = testUser
      ctx.prisma.userClub.findMany = vi.fn().mockResolvedValue(mockClubs)

      const result = await caller.myClubs()

      expect(ctx.prisma.userClub.findMany).toHaveBeenCalledWith({
        where: { userId: testUser.id },
        include: {
          club: {
            include: {
              teams: true,
              _count: {
                select: {
                  userClubs: true,
                  teams: true,
                  sessions: true,
                },
              },
            },
          },
        },
      })
      expect(result).toEqual(mockClubs)
    })

    it('should return empty array when user has no clubs', async () => {
      const testUser = createTestUser()
      ctx.user = testUser
      ctx.prisma.userClub.findMany = vi.fn().mockResolvedValue([])

      const result = await caller.myClubs()

      expect(result).toEqual([])
    })

    it('should handle database errors', async () => {
      const testUser = createTestUser()
      ctx.user = testUser
      ctx.prisma.userClub.findMany = vi.fn().mockRejectedValue(new Error('Database error'))

      await expect(caller.myClubs()).rejects.toThrow('Database error')
    })
  })

  describe('signOut', () => {
    it('should sign out user successfully', async () => {
      const testUser = createTestUser()
      ctx.user = testUser

      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockResolvedValue({ error: null }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      const result = await caller.signOut()

      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      expect(result).toEqual({ success: true })
    })

    it('should handle Supabase sign out errors', async () => {
      const testUser = createTestUser()
      ctx.user = testUser

      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockResolvedValue({ error: { message: 'Sign out failed' } }),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      // Should still return success even if Supabase fails
      const result = await caller.signOut()

      expect(result).toEqual({ success: true })
    })

    it('should handle network errors during sign out', async () => {
      const testUser = createTestUser()
      ctx.user = testUser

      const mockSupabase = {
        auth: {
          signOut: vi.fn().mockRejectedValue(new Error('Network error')),
        },
      }
      mockCreateClient.mockResolvedValue(mockSupabase)

      // Should still return success even if request fails
      const result = await caller.signOut()

      expect(result).toEqual({ success: true })
    })
  })

  describe('authorization', () => {
    it('should require authentication for protected procedures', async () => {
      // Set context user to null to simulate unauthenticated state
      ctx.user = null

      // All protected procedures should throw UNAUTHORIZED
      await expect(caller.me()).rejects.toThrow('You must be logged in to access this resource')
      await expect(caller.updateProfile({ name: 'Test' })).rejects.toThrow('You must be logged in to access this resource')
      await expect(caller.completeOnboarding({
        name: 'Test',
        role: 'head_coach',
        clubName: 'Test Club',
      })).rejects.toThrow('You must be logged in to access this resource')
      await expect(caller.myClubs()).rejects.toThrow('You must be logged in to access this resource')
      await expect(caller.signOut()).rejects.toThrow('You must be logged in to access this resource')
    })
  })
})