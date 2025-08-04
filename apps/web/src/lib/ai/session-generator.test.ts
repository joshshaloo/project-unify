/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateTrainingSession } from './session-generator'
import type { SessionGenerationParams } from './openai'

// Mock OpenAI first
vi.mock('./openai', () => ({
  getOpenAI: vi.fn(() => ({
    chat: {
      completions: {
        create: vi.fn(),
      },
    },
  })),
}))

describe('Session Generator', () => {
  let mockCreate: any
  let mockGetOpenAI: any

  const mockSessionParams: SessionGenerationParams = {
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
        date: new Date('2024-11-20'),
        focus: ['defending'],
        drills: ['Defensive positioning', 'Zonal marking'],
      },
    ],
  }

  const mockValidAIResponse = {
    title: 'U12 Passing and Shooting Session',
    objectives: [
      'Improve passing accuracy',
      'Develop shooting technique',
      'Enhance decision making',
      'Build team coordination',
    ],
    warmUp: {
      name: 'Dynamic Warm-Up with Ball',
      category: 'physical',
      duration: 15,
      description: 'Progressive warm-up incorporating ball work',
      objectives: ['Prepare body for activity', 'Activate muscle groups'],
      setup: {
        space: '20x20 yards',
        equipment: ['Cones', 'Balls'],
        organization: 'Players spread out in area',
      },
      instructions: ['Light jogging', 'Dynamic stretches', 'Ball work'],
      coachingPoints: ['Good posture', 'Quality movement'],
      progressions: ['Increase intensity'],
    },
    mainActivities: [
      {
        name: 'Passing Practice',
        category: 'technical',
        duration: 30,
        description: 'Technical passing development',
        objectives: ['Improve accuracy', 'Develop first touch'],
        setup: {
          space: '30x20 yards',
          equipment: ['Cones', 'Balls'],
          organization: 'Passing stations',
        },
        instructions: ['Work in pairs', 'Focus on technique'],
        coachingPoints: ['Inside foot', 'Body position'],
        progressions: ['Increase distance'],
      },
      {
        name: 'Shooting Practice',
        category: 'technical',
        duration: 30,
        description: 'Shooting technique and accuracy',
        objectives: ['Improve technique', 'Build confidence'],
        setup: {
          space: 'Penalty area',
          equipment: ['Balls', 'Goals'],
          organization: 'Shooting stations',
        },
        instructions: ['Various angles', 'Focus on accuracy'],
        coachingPoints: ['Plant foot', 'Head steady'],
        progressions: ['Add movement'],
      },
    ],
    coolDown: {
      name: 'Cool-Down and Stretch',
      category: 'physical',
      duration: 15,
      description: 'Recovery and reflection',
      objectives: ['Gradual recovery', 'Session reflection'],
      setup: {
        space: '20x20 yards',
        equipment: ['Balls'],
        organization: 'Open space',
      },
      instructions: ['Light activity', 'Static stretching'],
      coachingPoints: ['Hold stretches properly'],
      progressions: [],
    },
    notes: 'Focus on quality over quantity. Provide positive feedback.',
    totalDuration: 90,
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Set up the mock implementation
    mockCreate = vi.fn()
    const { getOpenAI } = await import('./openai')
    mockGetOpenAI = getOpenAI as any
    mockGetOpenAI.mockReturnValue({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('generateTrainingSession', () => {
    it('should generate session with valid AI response', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(mockValidAIResponse),
            },
          },
        ],
      })

      const result = await generateTrainingSession(mockSessionParams)

      expect(mockGetOpenAI).toHaveBeenCalled()
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('expert youth soccer coach'),
          },
          {
            role: 'user',
            content: expect.stringContaining('Create a 90-minute training training session'),
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000,
      })

      expect(result).toEqual(mockValidAIResponse)
    })

    it('should include focus areas in prompt when provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      await generateTrainingSession(mockSessionParams)

      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content
      expect(userPrompt).toContain('Focus areas: passing, shooting')
    })

    it('should include player count in prompt when provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      await generateTrainingSession(mockSessionParams)

      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content
      expect(userPrompt).toContain('Expected players: 15')
    })

    it('should include equipment in prompt when provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      await generateTrainingSession(mockSessionParams)

      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content
      expect(userPrompt).toContain('Available equipment: cones, balls, goals')
    })

    it('should handle missing optional parameters', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      const minimalParams: SessionGenerationParams = {
        teamId: 'team-123',
        ageGroup: 'U10',
        skillLevel: 'beginner',
        duration: 60,
        sessionType: 'skills',
      }

      await generateTrainingSession(minimalParams)

      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content
      expect(userPrompt).toContain('Create a 60-minute skills training session')
      expect(userPrompt).toContain('U10 team with beginner skill level')
      expect(userPrompt).toContain('Standard equipment available')
      expect(userPrompt).not.toContain('Focus areas:')
      expect(userPrompt).not.toContain('Expected players:')
    })

    it('should handle different session types', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      const sessionTypes = ['training', 'match_prep', 'skills'] as const

      for (const sessionType of sessionTypes) {
        await generateTrainingSession({
          ...mockSessionParams,
          sessionType,
        })

        const userPrompt = mockCreate.mock.calls[sessionTypes.indexOf(sessionType)][0].messages[1].content
        expect(userPrompt).toContain(`${sessionType} training session`)
      }
    })

    it('should construct proper system prompt for youth coaching', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      await generateTrainingSession(mockSessionParams)

      const systemPrompt = mockCreate.mock.calls[0][0].messages[0].content
      expect(systemPrompt).toContain('expert youth soccer coach')
      expect(systemPrompt).toContain('UEFA A License')
      expect(systemPrompt).toContain('age-appropriate')
      expect(systemPrompt).toContain('player development')
      expect(systemPrompt).toContain('fun')
      expect(systemPrompt).toContain('youth development')
    })

    it('should request proper session structure in prompt', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      await generateTrainingSession(mockSessionParams)

      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content
      expect(userPrompt).toContain('1. Warm-up (10-15% of total time)')
      expect(userPrompt).toContain('2. Main activities (70-75% of total time)')
      expect(userPrompt).toContain('3. Cool-down/Game (10-15% of total time)')
      expect(userPrompt).toContain('2-3 progressive drills')
    })

    it('should request detailed drill information', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(mockValidAIResponse) } }],
      })

      await generateTrainingSession(mockSessionParams)

      const userPrompt = mockCreate.mock.calls[0][0].messages[1].content
      expect(userPrompt).toContain('Clear objectives')
      expect(userPrompt).toContain('Detailed setup and space requirements')
      expect(userPrompt).toContain('Step-by-step instructions')
      expect(userPrompt).toContain('Key coaching points')
      expect(userPrompt).toContain('Progressions to increase/decrease difficulty')
      expect(userPrompt).toContain('age-appropriate')
      expect(userPrompt).toContain('focus on fun')
    })

    it('should validate AI response structure', async () => {
      const invalidResponse = {
        title: 'Test Session',
        // Missing required fields
      }

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: JSON.stringify(invalidResponse) } }],
      })

      const result = await generateTrainingSession(mockSessionParams)

      // Should fall back to generated session when validation fails
      expect(result.title).toContain('U12')
      expect(result.title).toContain('training')
      expect(result.objectives).toBeDefined()
      expect(result.warmUp).toBeDefined()
      expect(result.mainActivities).toBeDefined()
      expect(result.coolDown).toBeDefined()
      expect(result.totalDuration).toBe(90)
    })

    it('should handle AI API errors with fallback', async () => {
      mockCreate.mockRejectedValue(new Error('OpenAI API error'))

      const result = await generateTrainingSession(mockSessionParams)

      // Should return fallback session
      expect(result.title).toBe('U12 training Session')
      expect(result.objectives).toHaveLength(4)
      expect(result.warmUp).toBeDefined()
      expect(result.mainActivities).toHaveLength(3)
      expect(result.coolDown).toBeDefined()
      expect(result.totalDuration).toBe(90)
    })

    it('should handle empty AI response with fallback', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      })

      const result = await generateTrainingSession(mockSessionParams)

      // Should return fallback session
      expect(result).toBeDefined()
      expect(result.title).toBe('U12 training Session')
    })

    it('should handle malformed JSON response with fallback', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'invalid json {' } }],
      })

      const result = await generateTrainingSession(mockSessionParams)

      // Should return fallback session
      expect(result).toBeDefined()
      expect(result.title).toBe('U12 training Session')
    })

    it('should log errors appropriately', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      mockCreate.mockRejectedValue(new Error('Test error'))

      await generateTrainingSession(mockSessionParams)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error generating session:', expect.any(Error))
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('fallback session generation', () => {
    it('should create appropriate session structure', async () => {
      mockCreate.mockRejectedValue(new Error('API unavailable'))

      const result = await generateTrainingSession(mockSessionParams)

      expect(result.title).toBe('U12 training Session')
      expect(result.objectives).toEqual([
        'Improve technical skills',
        'Develop tactical understanding',
        'Enhance physical fitness',
        'Foster teamwork and communication',
      ])

      // Check warm-up structure
      expect(result.warmUp).toMatchObject({
        name: 'Dynamic Warm-Up with Ball',
        category: 'physical',
        duration: expect.any(Number),
        description: 'Progressive warm-up incorporating ball work',
        objectives: expect.arrayContaining(['Prepare body for activity']),
        setup: expect.objectContaining({
          space: '20x20 yards',
          equipment: expect.arrayContaining(['Cones', 'Balls']),
        }),
      })

      // Check main activities
      expect(result.mainActivities).toHaveLength(3)
      expect(result.mainActivities[0]).toMatchObject({
        name: 'Technical Skills Station',
        category: 'technical',
      })
      expect(result.mainActivities[1]).toMatchObject({
        name: 'Small-Sided Game',
        category: 'tactical',
      })
      expect(result.mainActivities[2]).toMatchObject({
        name: 'Skill Challenge',
        category: 'technical',
      })

      // Check cool-down
      expect(result.coolDown).toMatchObject({
        name: 'Cool-Down Game and Stretch',
        category: 'physical',
        objectives: expect.arrayContaining(['Gradual recovery']),
      })
    })

    it('should calculate appropriate durations', async () => {
      mockCreate.mockRejectedValue(new Error('API unavailable'))

      const result = await generateTrainingSession({
        ...mockSessionParams,
        duration: 120,
      })

      const warmUpDuration = Math.floor(120 * 0.15)
      const coolDownDuration = Math.floor(120 * 0.15)
      const mainDuration = 120 - warmUpDuration - coolDownDuration
      const drillDuration = Math.floor(mainDuration / 3)

      expect(result.warmUp.duration).toBe(warmUpDuration)
      expect(result.coolDown.duration).toBe(coolDownDuration)
      result.mainActivities.forEach(activity => {
        expect(activity.duration).toBe(drillDuration)
      })
      expect(result.totalDuration).toBe(120)
    })

    it('should adapt session title to parameters', async () => {
      mockCreate.mockRejectedValue(new Error('API unavailable'))

      const skillsSession = await generateTrainingSession({
        ...mockSessionParams,
        ageGroup: 'U16',
        sessionType: 'skills',
      })

      expect(skillsSession.title).toBe('U16 skills Session')

      const matchPrepSession = await generateTrainingSession({
        ...mockSessionParams,
        ageGroup: 'U14',
        sessionType: 'match_prep',
      })

      expect(matchPrepSession.title).toBe('U14 match prep Session')
    })

    it('should provide practical coaching content', async () => {
      mockCreate.mockRejectedValue(new Error('API unavailable'))

      const result = await generateTrainingSession(mockSessionParams)

      // Check that activities have practical content
      expect(result.warmUp.instructions).toContain('Start with light jogging around the area')
      expect(result.warmUp.coachingPoints).toContain('Maintain good posture')

      result.mainActivities.forEach(activity => {
        expect(activity.instructions).toBeDefined()
        expect(activity.instructions.length).toBeGreaterThan(0)
        expect(activity.coachingPoints).toBeDefined()
        expect(activity.coachingPoints.length).toBeGreaterThan(0)
      })

      expect(result.coolDown.instructions).toContain('Start with low-intensity possession game')
      expect(result.notes).toContain('Adapt activities based on player engagement')
    })

    it('should include proper equipment for each activity', async () => {
      mockCreate.mockRejectedValue(new Error('API unavailable'))

      const result = await generateTrainingSession(mockSessionParams)

      expect(result.warmUp.setup.equipment).toContain('Cones')
      expect(result.warmUp.setup.equipment).toContain('Balls')

      const technicalStation = result.mainActivities.find(a => a.name === 'Technical Skills Station')
      expect(technicalStation?.setup.equipment).toContain('Cones')
      expect(technicalStation?.setup.equipment).toContain('Balls')

      const smallSidedGame = result.mainActivities.find(a => a.name === 'Small-Sided Game')
      expect(smallSidedGame?.setup.equipment).toContain('Goals')
      expect(smallSidedGame?.setup.equipment).toContain('Bibs')
    })
  })
})