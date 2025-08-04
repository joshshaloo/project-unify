/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TRPCError } from '@trpc/server'
import { createMockTRPCContext } from '@/test/utils/test-utils'
import { createTestUser, createTestUserWithClub } from '@/test/factories'
import { aiRouter } from '../trpc/routers/ai'
import type { CoachWinstonResponse } from './n8n-client'

// Mock dependencies first
vi.mock('./n8n-client', () => ({
  n8nClient: {
    generateSession: vi.fn(),
    healthCheck: vi.fn(),
  },
  N8NClient: vi.fn(() => ({
    generateSession: vi.fn(),
    healthCheck: vi.fn(),
  })),
}))

vi.mock('./session-generator', () => ({
  generateTrainingSession: vi.fn(),
}))

vi.mock('../auth/roles', () => ({
  hasMinimumRole: vi.fn(() => true),
  getUserRoleInClub: vi.fn(() => 'head_coach'),
  ROLES: {
    ASSISTANT_COACH: 'assistant_coach',
    HEAD_COACH: 'head_coach',
  },
}))

// Mock environment variables
const originalEnv = process.env
vi.mock('process', () => ({
  env: {
    ...originalEnv,
    N8N_WEBHOOK_URL: 'https://n8n.example.com',
    OPENAI_API_KEY: 'test-openai-key',
  },
}))

describe('AI Session Generation Integration Tests', () => {
  let ctx: any
  let caller: any
  let mockN8nClient: any
  let mockGenerateTrainingSession: any

  const mockTeam = {
    id: 'team-123',
    clubId: 'club-123',
    name: 'U12 Tigers',
    ageGroup: 'U12',
    skillLevel: 'intermediate',
    players: Array.from({ length: 15 }, (_, i) => ({ id: `player-${i}` })),
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

  const mockN8nSuccessResponse: CoachWinstonResponse = {
    success: true,
    sessionId: 'n8n-session-123',
    sessionPlan: {
      sessionTitle: 'Passing and Shooting Mastery',
      overview: 'Comprehensive training focusing on passing accuracy and shooting technique',
      totalDuration: 90,
      ageGroup: 'U12',
      focusAreas: ['passing', 'shooting'],
      activities: [
        {
          phase: 'warm-up',
          name: 'Dynamic Warm-up with Ball',
          duration: 15,
          description: 'Progressive warm-up incorporating ball skills',
          setup: '20x20 yard area with cones marking boundaries',
          instructions: 'Players jog around area, progress to dynamic stretches with ball manipulation',
          coachingPoints: ['Maintain good posture', 'Gradual intensity increase', 'Quality of movement'],
          progressions: ['Add ball juggling', 'Increase tempo'],
          equipment: ['cones', 'balls'],
          safetyNotes: 'Ensure proper warm-up before intense activity',
        },
        {
          phase: 'technical',
          name: 'Passing Accuracy Circuit',
          duration: 25,
          description: 'Technical passing practice through gates and to targets',
          setup: '30x20 yard grid with passing gates and target areas',
          instructions: 'Players work in pairs, passing through gates and to specific targets',
          coachingPoints: ['Inside foot technique', 'Body position', 'Follow through', 'Weight of pass'],
          progressions: ['Increase distance', 'Add movement', 'Time pressure'],
          equipment: ['balls', 'cones', 'markers'],
        },
        {
          phase: 'tactical',
          name: 'Shooting from Build-up Play',
          duration: 25,
          description: 'Combination play leading to shooting opportunities',
          setup: 'Half pitch with goals and defined shooting zones',
          instructions: 'Teams combine passes to create shooting chances in designated zones',
          coachingPoints: ['Quick combination play', 'Movement in final third', 'Shooting technique', 'First touch'],
          progressions: ['Add defensive pressure', 'Reduce touches', 'Multiple goals'],
          equipment: ['balls', 'goals', 'bibs', 'cones'],
        },
        {
          phase: 'game',
          name: 'Conditioned Small-sided Game',
          duration: 15,
          description: 'Game emphasizing passing and shooting focus areas',
          setup: '40x30 yard pitch with small goals',
          instructions: '4v4 games with bonus points for shots after 5+ passes',
          coachingPoints: ['Build-up play', 'Creating space', 'Clinical finishing'],
          progressions: ['Vary team sizes', 'Add neutral players'],
          equipment: ['balls', 'small goals', 'bibs'],
        },
        {
          phase: 'cool-down',
          name: 'Recovery and Reflection',
          duration: 10,
          description: 'Gentle cool-down with session review',
          setup: 'Central circle area',
          instructions: 'Light stretching followed by group discussion of key learning points',
          coachingPoints: ['Proper stretching technique', 'Positive reinforcement'],
          equipment: ['balls'],
        },
      ],
      coachNotes: 'Focus on quality over quantity. Encourage players and provide specific feedback on technique.',
      adaptations: {
        forBeginners: 'Reduce distances, allow more touches, focus on basic technique',
        forAdvanced: 'Add time pressure, increase distances, introduce more complex combinations',
        weatherAlternatives: 'Indoor alternatives focus on ball work and technical skills',
      },
    },
    metadata: {
      generatedAt: '2024-01-01T12:00:00Z',
      teamId: 'team-123',
      requestId: 'req-123',
    },
  }

  const mockOpenAIFallbackSession = {
    title: 'U12 Training Session - Passing & Shooting',
    objectives: [
      'Improve passing accuracy',
      'Develop shooting technique',
      'Enhance decision making',
      'Build team coordination',
    ],
    warmUp: {
      name: 'Dynamic Warm-Up with Ball',
      category: 'physical' as const,
      duration: 15,
      description: 'Progressive warm-up incorporating ball work',
      objectives: ['Prepare body for activity', 'Activate muscle groups', 'Mental preparation'],
      setup: {
        space: '20x20 yards',
        equipment: ['Cones', 'Balls'],
        organization: 'Players spread out in designated area',
      },
      instructions: [
        'Start with light jogging around the area',
        'Progress to dynamic stretches',
        'Include ball manipulation exercises',
        'Gradually increase intensity',
      ],
      coachingPoints: [
        'Maintain good posture',
        'Focus on quality of movement',
        'Keep the ball close',
      ],
      progressions: ['Add juggling', 'Increase tempo'],
    },
    mainActivities: [
      {
        name: 'Passing Practice',
        category: 'technical' as const,
        duration: 30,
        description: 'Technical passing development',
        objectives: ['Improve passing accuracy', 'Develop first touch'],
        setup: {
          space: '30x20 yards',
          equipment: ['Cones', 'Balls', 'Markers'],
          organization: 'Set up passing stations',
        },
        instructions: [
          'Work in pairs at each station',
          'Focus on technique over speed',
          'Rotate every 5 minutes',
        ],
        coachingPoints: [
          'Inside foot technique',
          'Body position',
          'Follow through',
        ],
        progressions: ['Increase distance', 'Add movement'],
      },
      {
        name: 'Shooting Practice',
        category: 'technical' as const,
        duration: 30,
        description: 'Shooting technique and accuracy',
        objectives: ['Improve shooting technique', 'Build confidence'],
        setup: {
          space: 'Penalty area',
          equipment: ['Balls', 'Goals', 'Cones'],
          organization: 'Shooting stations with various angles',
        },
        instructions: [
          'Practice shots from different positions',
          'Focus on accuracy over power',
          'Include both feet',
        ],
        coachingPoints: [
          'Plant foot positioning',
          'Head steady over ball',
          'Follow through',
        ],
        progressions: ['Add movement', 'Time pressure'],
      },
    ],
    coolDown: {
      name: 'Cool-Down and Stretch',
      category: 'physical' as const,
      duration: 15,
      description: 'Recovery and session reflection',
      objectives: ['Gradual recovery', 'Session reflection'],
      setup: {
        space: '20x20 yards',
        equipment: ['Balls'],
        organization: 'Open space for stretching',
      },
      instructions: [
        'Light activity to bring heart rate down',
        'Static stretching routine',
        'Group discussion of session highlights',
      ],
      coachingPoints: [
        'Hold stretches appropriately',
        'Positive session summary',
      ],
      progressions: [],
    },
    notes: 'Encourage players throughout. Focus on individual improvement and team spirit.',
    totalDuration: 90,
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Initialize mock references
    const { n8nClient } = await import('./n8n-client')
    const { generateTrainingSession } = await import('./session-generator')
    mockN8nClient = n8nClient as any
    mockGenerateTrainingSession = generateTrainingSession as any
    
    ctx = createMockTRPCContext()
    caller = aiRouter.createCaller(ctx)

    // Set up default successful mocks
    ctx.prisma.team.findUnique.mockResolvedValue(mockTeam)
    ctx.prisma.session.findMany.mockResolvedValue([])
    ctx.prisma.session.create.mockResolvedValue({
      id: 'session-123',
      ...mockSessionInput,
      type: 'training',
      status: 'draft',
      aiGenerated: true,
      plan: {},
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Full N8N Integration Flow', () => {
    it('should successfully generate session via n8n with complete data transformation', async () => {
      mockN8nClient.generateSession.mockResolvedValue(mockN8nSuccessResponse)

      const result = await caller.generateSession(mockSessionInput)

      // Verify n8n client was called with correct parameters
      expect(mockN8nClient.generateSession).toHaveBeenCalledWith({
        teamId: 'team-123',
        duration: 90,
        focusAreas: ['passing', 'shooting'],
        ageGroup: 'U12',
        skillLevel: 'intermediate',
        playerCount: 15,
        availableEquipment: ['cones', 'balls', 'goals'],
        weatherConditions: 'good',
      })

      // Verify database session creation
      expect(ctx.prisma.session.create).toHaveBeenCalledWith({
        data: {
          clubId: 'club-123',
          teamId: 'team-123',
          createdByUserId: 'test-user-id',
          title: 'Passing and Shooting Mastery',
          date: mockSessionInput.date,
          duration: 90,
          type: 'training',
          status: 'draft',
          plan: expect.objectContaining({
            title: 'Passing and Shooting Mastery',
            objectives: ['passing', 'shooting'],
            totalDuration: 90,
            n8nMetadata: {
              sessionId: 'n8n-session-123',
              requestId: 'req-123',
              generatedAt: '2024-01-01T12:00:00Z',
            },
          }),
          aiGenerated: true,
        },
      })

      // Verify proper activity mapping
      const sessionPlan = ctx.prisma.session.create.mock.calls[0][0].data.plan
      
      // Check warm-up mapping
      expect(sessionPlan.warmUp).toMatchObject({
        name: 'Dynamic Warm-up with Ball',
        category: 'physical',
        duration: 15,
        description: 'Progressive warm-up incorporating ball skills',
        objectives: ['Maintain good posture', 'Gradual intensity increase'],
        setup: {
          space: '20x20 yards',
          equipment: ['cones', 'balls'],
          organization: '20x20 yard area with cones marking boundaries',
        },
        instructions: ['Players jog around area, progress to dynamic stretches with ball manipulation'],
        coachingPoints: ['Maintain good posture', 'Gradual intensity increase', 'Quality of movement'],
        progressions: ['Add ball juggling', 'Increase tempo'],
      })

      // Check main activities mapping
      expect(sessionPlan.mainActivities).toHaveLength(3) // technical, tactical, game
      
      const technicalActivity = sessionPlan.mainActivities[0]
      expect(technicalActivity).toMatchObject({
        name: 'Passing Accuracy Circuit',
        category: 'technical',
        duration: 25,
        setup: {
          space: '30x20 yards',
          equipment: ['balls', 'cones', 'markers'],
        },
      })

      const tacticalActivity = sessionPlan.mainActivities[1]
      expect(tacticalActivity).toMatchObject({
        name: 'Shooting from Build-up Play',
        category: 'tactical',
        duration: 25,
      })

      const gameActivity = sessionPlan.mainActivities[2]
      expect(gameActivity).toMatchObject({
        name: 'Conditioned Small-sided Game',
        category: 'tactical', // game phase maps to tactical
        duration: 15,
      })

      // Check cool-down mapping
      expect(sessionPlan.coolDown).toMatchObject({
        name: 'Recovery and Reflection',
        category: 'physical',
        duration: 10,
        objectives: ['Gradual recovery', 'Session reflection'],
      })

      // Verify response structure
      expect(result).toMatchObject({
        session: expect.objectContaining({
          id: 'session-123',
          title: 'Passing and Shooting Mastery',
        }),
        generatedPlan: expect.objectContaining({
          title: 'Passing and Shooting Mastery',
          totalDuration: 90,
        }),
        n8nMetadata: mockN8nSuccessResponse.metadata,
      })

      expect(result.fallbackUsed).toBeUndefined()
    })

    it('should fetch and use recent sessions for context', async () => {
      const recentSessions = [
        {
          id: 'session-1',
          date: new Date('2024-11-20T10:00:00Z'),
          plan: {
            focus: ['defending', 'crosses'],
            drills: [{ name: 'Defensive Positioning' }, { name: 'Cross Defense' }],
          },
        },
        {
          id: 'session-2',
          date: new Date('2024-11-18T10:00:00Z'),
          plan: {
            focus: ['passing'],
            drills: [{ name: 'Short Passing' }],
          },
        },
      ]

      ctx.prisma.session.findMany.mockResolvedValue(recentSessions)
      mockN8nClient.generateSession.mockResolvedValue(mockN8nSuccessResponse)

      await caller.generateSession(mockSessionInput)

      // Verify recent sessions query
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

      // Should still call n8n (recent sessions are for OpenAI fallback context)
      expect(mockN8nClient.generateSession).toHaveBeenCalled()
    })

    it('should handle n8n response with missing activities gracefully', async () => {
      const incompleteResponse = {
        ...mockN8nSuccessResponse,
        sessionPlan: {
          ...mockN8nSuccessResponse.sessionPlan!,
          activities: [
            {
              phase: 'technical' as const,
              name: 'Main Technical Work',
              duration: 60,
              description: 'Technical development',
              instructions: 'Practice skills',
              coachingPoints: ['Focus on technique'],
              equipment: ['balls'],
            },
          ],
        },
      }

      mockN8nClient.generateSession.mockResolvedValue(incompleteResponse)

      const result = await caller.generateSession(mockSessionInput)

      const sessionPlan = ctx.prisma.session.create.mock.calls[0][0].data.plan

      // Should have fallback warm-up and cool-down
      expect(sessionPlan.warmUp.name).toBe('Dynamic Warm-Up')
      expect(sessionPlan.coolDown.name).toBe('Cool-Down and Stretch')
      expect(sessionPlan.mainActivities).toHaveLength(1)
    })

    it('should handle n8n timeout and fall back to OpenAI', async () => {
      const timeoutError = new Error('Request timed out')
      timeoutError.name = 'TimeoutError'
      mockN8nClient.generateSession.mockRejectedValue(timeoutError)
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      const result = await caller.generateSession(mockSessionInput)

      // Verify n8n was attempted first
      expect(mockN8nClient.generateSession).toHaveBeenCalled()

      // Verify fallback to OpenAI
      expect(mockGenerateTrainingSession).toHaveBeenCalledWith({
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

      // Verify fallback metadata is stored
      const sessionPlan = ctx.prisma.session.create.mock.calls[0][0].data.plan
      expect(sessionPlan.fallbackMetadata).toMatchObject({
        fallbackUsed: true,
        fallbackReason: 'Request timed out',
      })

      expect(result.fallbackUsed).toBe(true)
      expect(result.n8nMetadata).toBeUndefined()
    })
  })

  describe('OpenAI Fallback Integration', () => {
    it('should provide recent sessions context to OpenAI fallback', async () => {
      const recentSessions = [
        {
          id: 'session-1',
          date: new Date('2024-11-20T10:00:00Z'),
          plan: {
            focus: ['defending', 'set pieces'],
            drills: [
              { name: 'Zonal Marking' },
              { name: 'Corner Defense' },
              { name: 'Free Kick Wall' },
            ],
          },
        },
        {
          id: 'session-2',
          date: new Date('2024-11-18T10:00:00Z'),
          plan: {
            focus: ['attacking'],
            drills: [
              { name: 'Forward Runs' },
              { name: 'Crossing Practice' },
            ],
          },
        },
      ]

      ctx.prisma.session.findMany.mockResolvedValue(recentSessions)
      mockN8nClient.generateSession.mockRejectedValue(new Error('n8n unavailable'))
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      await caller.generateSession(mockSessionInput)

      expect(mockGenerateTrainingSession).toHaveBeenCalledWith({
        teamId: 'team-123',
        ageGroup: 'U12',
        skillLevel: 'intermediate',
        duration: 90,
        sessionType: 'training',
        focus: ['passing', 'shooting'],
        playerCount: 15,
        equipment: ['cones', 'balls', 'goals'],
        previousSessions: [
          {
            date: new Date('2024-11-20T10:00:00Z'),
            focus: ['defending', 'set pieces'],
            drills: ['Zonal Marking', 'Corner Defense', 'Free Kick Wall'],
          },
          {
            date: new Date('2024-11-18T10:00:00Z'),
            focus: ['attacking'],
            drills: ['Forward Runs', 'Crossing Practice'],
          },
        ],
      })
    })

    it('should handle malformed previous session data', async () => {
      const malformedSessions = [
        {
          id: 'session-1',
          date: new Date('2024-11-20T10:00:00Z'),
          plan: null, // Malformed - no plan
        },
        {
          id: 'session-2',
          date: new Date('2024-11-18T10:00:00Z'),
          plan: {
            // Missing focus and drills
            title: 'Some session',
          },
        },
        {
          id: 'session-3',
          date: new Date('2024-11-16T10:00:00Z'),
          plan: {
            focus: ['passing'],
            drills: [
              { name: 'Pass and Move' },
              { invalidStructure: true }, // Malformed drill
            ],
          },
        },
      ]

      ctx.prisma.session.findMany.mockResolvedValue(malformedSessions)
      mockN8nClient.generateSession.mockRejectedValue(new Error('n8n down'))
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      await caller.generateSession(mockSessionInput)

      expect(mockGenerateTrainingSession).toHaveBeenCalledWith(
        expect.objectContaining({
          previousSessions: [
            {
              date: new Date('2024-11-20T10:00:00Z'),
              focus: [],
              drills: [],
            },
            {
              date: new Date('2024-11-18T10:00:00Z'),
              focus: [],
              drills: [],
            },
            {
              date: new Date('2024-11-16T10:00:00Z'),
              focus: ['passing'],
              drills: ['Pass and Move'], // Only valid drill included
            },
          ],
        })
      )
    })

    it('should handle complete OpenAI fallback failure', async () => {
      mockN8nClient.generateSession.mockRejectedValue(new Error('n8n service down'))
      mockGenerateTrainingSession.mockRejectedValue(new Error('OpenAI quota exceeded'))

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow('OpenAI quota exceeded')

      expect(mockN8nClient.generateSession).toHaveBeenCalled()
      expect(mockGenerateTrainingSession).toHaveBeenCalled()
      expect(ctx.prisma.session.create).not.toHaveBeenCalled()
    })
  })

  describe('Authorization and Data Validation Integration', () => {
    it('should validate team ownership before generation', async () => {
      const wrongClubTeam = { ...mockTeam, clubId: 'different-club-456' }
      ctx.prisma.team.findUnique.mockResolvedValue(wrongClubTeam)

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow(
        new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        })
      )

      expect(mockN8nClient.generateSession).not.toHaveBeenCalled()
      expect(mockGenerateTrainingSession).not.toHaveBeenCalled()
    })

    it('should validate user role before allowing generation', async () => {
      const { getUserRoleInClub, hasMinimumRole } = require('../auth/roles')
      
      getUserRoleInClub.mockReturnValue('parent')
      hasMinimumRole.mockReturnValue(false)

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow(
        new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can generate training sessions',
        })
      )

      expect(mockN8nClient.generateSession).not.toHaveBeenCalled()
    })

    it('should handle database transaction failures', async () => {
      mockN8nClient.generateSession.mockResolvedValue(mockN8nSuccessResponse)
      ctx.prisma.session.create.mockRejectedValue(new Error('Database connection failed'))

      await expect(caller.generateSession(mockSessionInput)).rejects.toThrow('Database connection failed')

      // N8N should have succeeded
      expect(mockN8nClient.generateSession).toHaveBeenCalled()
    })

    it('should validate team player count and update generation parameters', async () => {
      const largeTeam = {
        ...mockTeam,
        players: Array.from({ length: 25 }, (_, i) => ({ id: `player-${i}` })),
      }
      ctx.prisma.team.findUnique.mockResolvedValue(largeTeam)
      mockN8nClient.generateSession.mockResolvedValue(mockN8nSuccessResponse)

      await caller.generateSession(mockSessionInput)

      expect(mockN8nClient.generateSession).toHaveBeenCalledWith(
        expect.objectContaining({
          playerCount: 25,
        })
      )
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle partial n8n response corruption', async () => {
      const corruptedResponse = {
        success: true,
        sessionPlan: {
          sessionTitle: 'Test Session',
          overview: 'Test overview',
          totalDuration: 90,
          ageGroup: 'U12',
          focusAreas: ['passing'],
          activities: [
            {
              phase: 'warm-up' as const,
              name: 'Warm Up',
              duration: 15,
              description: 'Warm up activity',
              instructions: 'Do warm up',
              // Missing other required fields
            },
            {
              // Completely malformed activity
              invalidData: true,
            } as any,
          ],
        },
        metadata: {
          generatedAt: '2024-01-01T12:00:00Z',
          teamId: 'team-123',
          requestId: 'req-123',
        },
      }

      mockN8nClient.generateSession.mockResolvedValue(corruptedResponse)
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      const result = await caller.generateSession(mockSessionInput)

      // Should fall back to OpenAI due to validation failure
      expect(result.fallbackUsed).toBe(true)
      expect(mockGenerateTrainingSession).toHaveBeenCalled()
    })

    it('should handle n8n service returning invalid JSON', async () => {
      mockN8nClient.generateSession.mockRejectedValue(new SyntaxError('Unexpected token in JSON'))
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      const result = await caller.generateSession(mockSessionInput)

      expect(result.fallbackUsed).toBe(true)
      expect(mockGenerateTrainingSession).toHaveBeenCalled()
    })

    it('should maintain session generation flow despite logging errors', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockN8nClient.generateSession.mockRejectedValue(new Error('Service temporarily unavailable'))
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      const result = await caller.generateSession(mockSessionInput)

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'N8N session generation failed, falling back to direct AI:',
        expect.any(Error)
      )
      expect(result.fallbackUsed).toBe(true)
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Performance and Resource Management', () => {
    it('should not retry n8n request multiple times', async () => {
      mockN8nClient.generateSession.mockRejectedValue(new Error('Temporary failure'))
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      await caller.generateSession(mockSessionInput)

      // Should only call n8n once, not retry
      expect(mockN8nClient.generateSession).toHaveBeenCalledTimes(1)
      expect(mockGenerateTrainingSession).toHaveBeenCalledTimes(1)
    })

    it('should limit recent sessions query to prevent performance issues', async () => {
      mockN8nClient.generateSession.mockRejectedValue(new Error('n8n down'))
      mockGenerateTrainingSession.mockResolvedValue(mockOpenAIFallbackSession)

      await caller.generateSession(mockSessionInput)

      expect(ctx.prisma.session.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5, // Limited to 5 sessions
        })
      )
    })

    it('should handle concurrent session generation requests safely', async () => {
      mockN8nClient.generateSession.mockResolvedValue(mockN8nSuccessResponse)

      // Simulate concurrent requests
      const promises = [
        caller.generateSession({ ...mockSessionInput, teamId: 'team-1' }),
        caller.generateSession({ ...mockSessionInput, teamId: 'team-2' }),
        caller.generateSession({ ...mockSessionInput, teamId: 'team-3' }),
      ]

      // Setup different teams for each request
      ctx.prisma.team.findUnique
        .mockResolvedValueOnce({ ...mockTeam, id: 'team-1' })
        .mockResolvedValueOnce({ ...mockTeam, id: 'team-2' })
        .mockResolvedValueOnce({ ...mockTeam, id: 'team-3' })

      ctx.prisma.session.create
        .mockResolvedValueOnce({ id: 'session-1', teamId: 'team-1' })
        .mockResolvedValueOnce({ id: 'session-2', teamId: 'team-2' })
        .mockResolvedValueOnce({ id: 'session-3', teamId: 'team-3' })

      const results = await Promise.all(promises)

      expect(results).toHaveLength(3)
      expect(mockN8nClient.generateSession).toHaveBeenCalledTimes(3)
      expect(ctx.prisma.session.create).toHaveBeenCalledTimes(3)
    })
  })
})