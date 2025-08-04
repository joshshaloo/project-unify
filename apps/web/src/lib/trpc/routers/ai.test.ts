/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { createMockTRPCContext } from '@/test/utils/test-utils'
// import { createTestUser, createTestUserWithClub } from '@/test/factories'
import { aiRouter } from './ai'

// Mock dependencies
vi.mock('../../ai/n8n-client', () => ({
  n8nClient: {
    generateSession: vi.fn(),
  },
}))

vi.mock('../../ai/session-generator', () => ({
  generateTrainingSession: vi.fn(),
}))

vi.mock('../../auth/roles', () => ({
  hasMinimumRole: vi.fn(),
  getUserRoleInClub: vi.fn(),
  ROLES: {
    ASSISTANT_COACH: 'assistant_coach',
    HEAD_COACH: 'head_coach',
  },
}))

describe('AI Router', () => {
  let ctx: any
  let caller: any
  let n8nClient: any
  let generateTrainingSession: any
  let hasMinimumRole: any
  let getUserRoleInClub: any

  beforeEach(async () => {
    const n8nClientModule = await import('../../ai/n8n-client')
    const sessionGeneratorModule = await import('../../ai/session-generator')
    const authRolesModule = await import('../../auth/roles')
    n8nClient = (n8nClientModule as any).n8nClient
    generateTrainingSession = (sessionGeneratorModule as any).generateTrainingSession
    hasMinimumRole = (authRolesModule as any).hasMinimumRole
    getUserRoleInClub = (authRolesModule as any).getUserRoleInClub
    vi.clearAllMocks()
    ctx = createMockTRPCContext()
    caller = aiRouter.createCaller(ctx)
  })

  describe('generateSession', () => {
    const mockTeam = {
      id: 'team-123',
      clubId: 'club-123',
      name: 'U12 Tigers',
      ageGroup: 'U12',
      skillLevel: 'intermediate',
      players: new Array(15).fill(null).map((_, i) => ({ id: `player-${i}` })),
    }

    const mockSessionInput = {
      clubId: 'club-123',
      teamId: 'team-123',
      date: new Date('2024-12-01T10:00:00Z'),
      duration: 90,
      sessionType: 'training' as const,
      focus: ['passing', 'shooting'],
      equipment: ['cones', 'balls', 'goals'],
    }

    const mockN8nResponse = {
      success: true,
      sessionId: 'n8n-session-123',
      sessionPlan: {
        sessionTitle: 'Passing and Shooting Training',
        overview: 'A comprehensive training session',
        totalDuration: 90,
        ageGroup: 'U12',
        focusAreas: ['passing', 'shooting'],
        activities: [
          {
            phase: 'warm-up' as const,
            name: 'Dynamic Warm-up',
            duration: 15,
            description: 'Light jogging and dynamic stretches',
            setup: '20x20 yard area',
            instructions: 'Players jog around the area',
            coachingPoints: ['Proper posture'],
            progressions: ['Add ball work'],
            equipment: ['cones'],
          },
          {
            phase: 'technical' as const,
            name: 'Passing Practice',
            duration: 45,
            description: 'Short and long passing drills',
            setup: '30x20 yard grid',
            instructions: 'Players work in pairs',
            coachingPoints: ['Inside foot technique'],
            progressions: ['Increase distance'],
            equipment: ['balls', 'cones'],
          },
          {
            phase: 'cool-down' as const,
            name: 'Cool Down',
            duration: 15,
            description: 'Light stretching',
            instructions: 'Static stretching',
            coachingPoints: ['Hold stretches properly'],
            equipment: ['balls'],
          },
        ],
        coachNotes: 'Focus on technical execution',
      },
      metadata: {
        generatedAt: '2024-01-01T12:00:00Z',
        teamId: 'team-123',
        requestId: 'req-123',
      },
    }

    const mockCreatedSession = {
      id: 'session-123',
      clubId: 'club-123',
      teamId: 'team-123',
      createdByUserId: 'test-user-id',
      title: 'Passing and Shooting Training',
      date: mockSessionInput.date,
      duration: 90,
      type: 'training',
      status: 'draft',
      aiGenerated: true,
      plan: expect.any(Object),
    }

    beforeEach(() => {
      // Setup default mocks
      getUserRoleInClub.mockReturnValue('head_coach')
      hasMinimumRole.mockReturnValue(true)
      ctx.prisma.team.findUnique.mockResolvedValue(mockTeam)
      ctx.prisma.session.findMany.mockResolvedValue([])
      ctx.prisma.session.create.mockResolvedValue(mockCreatedSession)
    })

    it('should successfully generate session via n8n', async () => {
      n8nClient.generateSession.mockResolvedValue(mockN8nResponse)

      const result = await caller.generateSession(mockSessionInput)

      expect(getUserRoleInClub).toHaveBeenCalledWith(ctx.user.clubs, 'club-123')
      expect(hasMinimumRole).toHaveBeenCalledWith('head_coach', 'assistant_coach')
      expect(ctx.prisma.team.findUnique).toHaveBeenCalledWith({
        where: { id: 'team-123' },
        include: { players: true },
      })
      expect(n8nClient.generateSession).toHaveBeenCalledWith({
        teamId: 'team-123',
        duration: 90,
        focusAreas: ['passing', 'shooting'],
        ageGroup: 'U12',
        skillLevel: 'intermediate',
        playerCount: 15,
        availableEquipment: ['cones', 'balls', 'goals'],
        weatherConditions: 'good',
      })
      expect(ctx.prisma.session.create).toHaveBeenCalled()
      expect(result.session).toEqual(mockCreatedSession)
      expect(result.n8nMetadata).toEqual(mockN8nResponse.metadata)
    })

    it('should check user permissions', async () => {
      getUserRoleInClub.mockReturnValue(null)

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can generate training sessions',
        })
      )
    })

    it('should check minimum role requirement', async () => {
      getUserRoleInClub.mockReturnValue('parent')
      hasMinimumRole.mockReturnValue(false)

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can generate training sessions',
        })
      )
    })

    it('should validate team exists and belongs to club', async () => {
      ctx.prisma.team.findUnique.mockResolvedValue(null)

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      )
    })

    it('should validate team belongs to correct club', async () => {
      const wrongClubTeam = { ...mockTeam, clubId: 'different-club' }
      ctx.prisma.team.findUnique.mockResolvedValue(wrongClubTeam)

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      )
    })

    it('should fetch recent sessions for context', async () => {
      n8nClient.generateSession.mockResolvedValue(mockN8nResponse)
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)

      await caller.generateSession(mockSessionInput)

      expect(ctx.prisma.session.findMany).toHaveBeenCalledWith({
        where: {
          teamId: 'team-123',
          date: {
            gte: expect.any(Date),
          },
        },
        orderBy: { date: 'desc' },
        take: 5,
      })

      const callArgs = ctx.prisma.session.findMany.mock.calls[0][0]
      const dateFilter = callArgs.where.date.gte
      expect(dateFilter.getTime()).toBeCloseTo(twoWeeksAgo.getTime(), -1000) // Within 1 second
    })

    it('should fallback to OpenAI when n8n fails', async () => {
      const n8nError = new Error('n8n service unavailable')
      n8nClient.generateSession.mockRejectedValue(n8nError)

      const fallbackSession = {
        title: 'Fallback Training Session',
        objectives: ['Skill development'],
        warmUp: {
          name: 'Warm Up',
          category: 'physical',
          duration: 15,
          description: 'Basic warm up',
          objectives: ['Prepare body'],
          setup: { space: '20x20', equipment: ['cones'], organization: 'Spread out' },
          instructions: ['Light jogging'],
          coachingPoints: ['Good posture'],
          progressions: [],
        },
        mainActivities: [],
        coolDown: {
          name: 'Cool Down',
          category: 'physical',
          duration: 10,
          description: 'Recovery',
          objectives: ['Recovery'],
          setup: { space: '20x20', equipment: ['balls'], organization: 'Open space' },
          instructions: ['Stretching'],
          coachingPoints: ['Hold stretches'],
          progressions: [],
        },
        notes: 'Fallback session',
        totalDuration: 90,
      }

      generateTrainingSession.mockResolvedValue(fallbackSession)

      const result = await caller.generateSession(mockSessionInput)

      expect(generateTrainingSession).toHaveBeenCalledWith({
        teamId: 'team-123',
        ageGroup: 'U12',
        skillLevel: 'intermediate',
        duration: 90,
        sessionType: 'training',
        focus: ['passing', 'shooting'],
        playerCount: 15,
        equipment: ['cones', 'balls', 'goals'],
        previousSessions: [],
      })

      expect(result.fallbackUsed).toBe(true)
      expect(result.session.plan.fallbackMetadata.fallbackUsed).toBe(true)
      expect(result.session.plan.fallbackMetadata.fallbackReason).toContain('n8n service unavailable')
    })

    it('should handle n8n unsuccessful response', async () => {
      const unsuccessfulResponse = {
        success: false,
        error: {
          message: 'AI model is currently overloaded',
          code: 'MODEL_OVERLOADED',
          timestamp: '2024-01-01T12:00:00Z',
          requestId: 'req-123',
        },
      }
      n8nClient.generateSession.mockResolvedValue(unsuccessfulResponse)
      generateTrainingSession.mockResolvedValue({
        title: 'Fallback Session',
        objectives: [],
        warmUp: expect.any(Object),
        mainActivities: [],
        coolDown: expect.any(Object),
        notes: 'Fallback',
        totalDuration: 90,
      })

      const result = await caller.generateSession(mockSessionInput)

      expect(result.fallbackUsed).toBe(true)
    })

    it('should handle malformed n8n response', async () => {
      const malformedResponse = {
        success: true,
        sessionPlan: null, // Invalid - should have sessionPlan when success is true
      }
      n8nClient.generateSession.mockResolvedValue(malformedResponse)
      generateTrainingSession.mockResolvedValue({
        title: 'Fallback Session',
        objectives: [],
        warmUp: expect.any(Object),
        mainActivities: [],
        coolDown: expect.any(Object),
        notes: 'Fallback',
        totalDuration: 90,
      })

      const result = await caller.generateSession(mockSessionInput)

      expect(result.fallbackUsed).toBe(true)
    })

    it('should properly map n8n response to internal format', async () => {
      const complexN8nResponse = {
        ...mockN8nResponse,
        sessionPlan: {
          ...mockN8nResponse.sessionPlan,
          activities: [
            {
              phase: 'warm-up' as const,
              name: 'Dynamic Warm-up',
              duration: 15,
              description: 'Prepare for training',
              setup: 'Use 30x20 yard area with cones in corners',
              instructions: 'Start with light jogging',
              coachingPoints: ['Maintain good posture', 'Gradual intensity'],
              progressions: ['Add ball work', 'Increase speed'],
              equipment: ['cones', 'balls'],
            },
            {
              phase: 'technical' as const,
              name: 'Passing Drill',
              duration: 30,
              description: 'Technical passing practice',
              setup: '25x15 yard grid with gates',
              instructions: 'Pass through gates',
              coachingPoints: ['Accurate passing', 'Quick decisions'],
              equipment: ['balls', 'cones'],
            },
            {
              phase: 'tactical' as const,
              name: 'Small-sided Game',
              duration: 30,
              description: 'Apply skills in game',
              setup: 'Half pitch',
              instructions: 'Play 7v7',
              coachingPoints: ['Team shape', 'Communication'],
              equipment: ['balls', 'bibs', 'goals'],
            },
            {
              phase: 'cool-down' as const,
              name: 'Recovery',
              duration: 15,
              description: 'Cool down and stretch',
              instructions: 'Light stretching',
              coachingPoints: ['Hold stretches'],
              equipment: [],
            },
          ],
        },
      }

      n8nClient.generateSession.mockResolvedValue(complexN8nResponse)

      const result = await caller.generateSession(mockSessionInput)

      const sessionPlan = result.session.plan
      
      // Check warm-up mapping
      expect(sessionPlan.warmUp).toMatchObject({
        name: 'Dynamic Warm-up',
        category: 'physical',
        duration: 15,
        description: 'Prepare for training',
        objectives: ['Maintain good posture', 'Gradual intensity'],
        setup: {
          space: '30x20 yards',
          equipment: ['cones', 'balls'],
          organization: 'Use 30x20 yard area with cones in corners',
        },
        instructions: ['Start with light jogging'],
        coachingPoints: ['Maintain good posture', 'Gradual intensity'],
        progressions: ['Add ball work', 'Increase speed'],
      })

      // Check main activities mapping
      expect(sessionPlan.mainActivities).toHaveLength(2)
      expect(sessionPlan.mainActivities[0]).toMatchObject({
        name: 'Passing Drill',
        category: 'technical',
        duration: 30,
        setup: {
          space: '25x15 yards',
          equipment: ['balls', 'cones'],
          organization: '25x15 yard grid with gates',
        },
      })

      expect(sessionPlan.mainActivities[1]).toMatchObject({
        name: 'Small-sided Game',
        category: 'tactical', // tactical phase maps to tactical category
        duration: 30,
      })

      // Check cool-down mapping
      expect(sessionPlan.coolDown).toMatchObject({
        name: 'Recovery',
        category: 'physical',
        duration: 15,
        objectives: ['Gradual recovery', 'Session reflection'],
      })
    })

    it('should create fallback activities when missing from n8n response', async () => {
      const responseWithoutWarmup = {
        ...mockN8nResponse,
        sessionPlan: {
          ...mockN8nResponse.sessionPlan,
          activities: [
            {
              phase: 'technical' as const,
              name: 'Main Drill',
              duration: 75,
              description: 'Main activity',
              instructions: 'Practice skills',
              coachingPoints: ['Focus'],
              equipment: ['balls'],
            },
          ],
        },
      }

      n8nClient.generateSession.mockResolvedValue(responseWithoutWarmup)

      const result = await caller.generateSession(mockSessionInput)
      const sessionPlan = result.session.plan

      // Should have fallback warm-up and cool-down
      expect(sessionPlan.warmUp.name).toBe('Dynamic Warm-Up')
      expect(sessionPlan.coolDown.name).toBe('Cool-Down and Stretch')
      expect(sessionPlan.mainActivities).toHaveLength(1)
    })

    it('should store n8n metadata in session', async () => {
      n8nClient.generateSession.mockResolvedValue(mockN8nResponse)

      const result = await caller.generateSession(mockSessionInput)

      expect(result.session.plan.n8nMetadata).toEqual({
        sessionId: 'n8n-session-123',
        requestId: 'req-123',
        generatedAt: '2024-01-01T12:00:00Z',
      })
    })

    it('should validate input parameters', async () => {
      // Test duration validation
      await expect(caller.generateSession({
        ...mockSessionInput,
        duration: 25, // Too short
      })).rejects.toThrow()

      await expect(caller.generateSession({
        ...mockSessionInput,
        duration: 200, // Too long
      })).rejects.toThrow()

      // Test invalid session type
      await expect(caller.generateSession({
        ...mockSessionInput,
        sessionType: 'invalid' as any,
      })).rejects.toThrow()
    })
  })

  describe('regenerateSection', () => {
    const mockSession = {
      id: 'session-123',
      clubId: 'club-123',
      teamId: 'team-123',
      team: {
        id: 'team-123',
        name: 'U12 Tigers',
      },
    }

    beforeEach(() => {
      getUserRoleInClub.mockReturnValue('head_coach')
      hasMinimumRole.mockReturnValue(true)
      ctx.prisma.session.findUnique.mockResolvedValue(mockSession)
    })

    it('should throw NOT_IMPLEMENTED error', async () => {
      await expect(caller.regenerateSection({
        sessionId: 'session-123',
        section: 'warmUp',
        requirements: 'More dynamic movements',
      })).rejects.toThrow(
        new TRPCError({
          code: 'NOT_IMPLEMENTED',
          message: 'Section regeneration is coming soon',
        })
      )
    })

    it('should check session exists', async () => {
      ctx.prisma.session.findUnique.mockResolvedValue(null)

      await expect(caller.regenerateSection({
        sessionId: 'session-123',
        section: 'warmUp',
      })).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        })
      )
    })

    it('should check user permissions', async () => {
      getUserRoleInClub.mockReturnValue(null)

      await expect(caller.regenerateSection({
        sessionId: 'session-123',
        section: 'warmUp',
      })).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can modify training sessions',
        })
      )
    })

    it('should validate section parameter', async () => {
      await expect(caller.regenerateSection({
        sessionId: 'session-123',
        section: 'invalid' as any,
      })).rejects.toThrow()
    })
  })

  describe('suggestDrills', () => {
    it('should return mock drill suggestions', async () => {
      const result = await caller.suggestDrills({
        ageGroup: 'U12',
        category: 'technical',
        focus: 'passing',
        playerCount: 15,
        duration: 20,
      })

      expect(result.drills).toHaveLength(1)
      expect(result.drills[0]).toMatchObject({
        name: 'passing Development Drill',
        category: 'technical',
        duration: 20,
        description: 'A drill focused on improving passing for U12 players',
        difficulty: 'intermediate',
      })
    })

    it('should validate input parameters', async () => {
      await expect(caller.suggestDrills({
        ageGroup: 'U12',
        category: 'invalid' as any,
        focus: 'passing',
        playerCount: 15,
        duration: 20,
      })).rejects.toThrow()
    })
  })

  describe('authorization', () => {
    beforeEach(() => {
      ctx.user = null // Simulate unauthenticated user
    })

    it('should require authentication for all procedures', async () => {
      await expect(caller.generateSession({
        clubId: 'club-123',
        teamId: 'team-123',
        date: new Date(),
        duration: 90,
        sessionType: 'training',
      })).rejects.toThrow()

      await expect(caller.regenerateSection({
        sessionId: 'session-123',
        section: 'warmUp',
      })).rejects.toThrow()

      // suggestDrills doesn't require auth currently, but let's test anyway
      const result = await caller.suggestDrills({
        ageGroup: 'U12',
        category: 'technical',
        focus: 'passing',
        playerCount: 15,
        duration: 20,
      })
      expect(result).toBeDefined()
    })
  })
})