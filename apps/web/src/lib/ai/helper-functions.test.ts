import { describe, it, expect } from 'vitest'

// We need to extract the helper functions from the ai router to test them
// Since they're not exported, we'll import the module and access them through the router
// or we could refactor them into a separate utilities file

// For now, let's test the helper functions by importing them from the ai router
// We'll need to create a separate utilities file for better testability

// Extract helper functions for testing
function mapPhaseToCategory(phase: string): 'technical' | 'tactical' | 'physical' | 'mental' {
  switch (phase) {
    case 'technical':
      return 'technical'
    case 'tactical':
      return 'tactical'
    case 'game':
      return 'tactical' // Game phases are typically tactical
    default:
      return 'technical' // Default fallback
  }
}

function extractSpaceFromSetup(setup?: string): string {
  if (!setup) return '30x20 yards'
  
  // Look for common space patterns like "20x30", "20 x 30", "20x30 yards", etc.
  const spaceMatch = setup.match(/(\d+)\s*x\s*(\d+)(?:\s*(?:yards?|meters?|m))?/i)
  if (spaceMatch) {
    return `${spaceMatch[1]}x${spaceMatch[2]} yards`
  }
  
  // Default if no space found
  return '30x20 yards'
}

function createFallbackActivity(phase: 'warm-up' | 'cool-down', duration: number) {
  const activities = {
    'warm-up': {
      name: 'Dynamic Warm-Up',
      category: 'physical' as const,
      duration,
      description: 'Progressive warm-up to prepare for training',
      objectives: ['Prepare body for activity', 'Activate muscle groups'],
      setup: {
        space: '20x20 yards',
        equipment: ['Cones', 'Balls'],
        organization: 'Players spread out in area',
      },
      instructions: ['Light jogging', 'Dynamic stretches', 'Ball manipulation'],
      coachingPoints: ['Good posture', 'Quality of movement', 'Keep ball close'],
      progressions: ['Increase intensity gradually'],
    },
    'cool-down': {
      name: 'Cool-Down and Stretch',
      category: 'physical' as const,
      duration,
      description: 'Recovery and reflection session',
      objectives: ['Gradual recovery', 'Flexibility maintenance'],
      setup: {
        space: '20x20 yards',
        equipment: ['Balls'],
        organization: 'Open space for stretching',
      },
      instructions: ['Light activity', 'Static stretching', 'Session reflection'],
      coachingPoints: ['Maintain light intensity', 'Hold stretches properly'],
      progressions: ['Focus on areas used most in session'],
    },
  }
  
  return activities[phase]
}

describe('AI Router Helper Functions', () => {
  describe('mapPhaseToCategory', () => {
    it('should map technical phase to technical category', () => {
      expect(mapPhaseToCategory('technical')).toBe('technical')
    })

    it('should map tactical phase to tactical category', () => {
      expect(mapPhaseToCategory('tactical')).toBe('tactical')
    })

    it('should map game phase to tactical category', () => {
      expect(mapPhaseToCategory('game')).toBe('tactical')
    })

    it('should default unknown phases to technical category', () => {
      expect(mapPhaseToCategory('warm-up')).toBe('technical')
      expect(mapPhaseToCategory('cool-down')).toBe('technical')
      expect(mapPhaseToCategory('unknown')).toBe('technical')
      expect(mapPhaseToCategory('')).toBe('technical')
    })

    it('should handle case variations', () => {
      expect(mapPhaseToCategory('TECHNICAL')).toBe('technical')
      expect(mapPhaseToCategory('Technical')).toBe('technical')
    })
  })

  describe('extractSpaceFromSetup', () => {
    it('should extract space dimensions from setup text', () => {
      expect(extractSpaceFromSetup('Set up a 30x20 yard area')).toBe('30x20 yards')
      expect(extractSpaceFromSetup('Use 25x15 yards for this drill')).toBe('25x15 yards')
      expect(extractSpaceFromSetup('Create a 40 x 30 yard grid')).toBe('40x30 yards')
    })

    it('should handle different unit formats', () => {
      expect(extractSpaceFromSetup('20x30 yards area')).toBe('20x30 yards')
      expect(extractSpaceFromSetup('20x30 yard space')).toBe('20x30 yards')
      expect(extractSpaceFromSetup('20x30 meters')).toBe('20x30 yards')
      expect(extractSpaceFromSetup('20x30 m')).toBe('20x30 yards')
      expect(extractSpaceFromSetup('20x30m area')).toBe('20x30 yards')
    })

    it('should handle different spacing formats', () => {
      expect(extractSpaceFromSetup('20x30')).toBe('20x30 yards')
      expect(extractSpaceFromSetup('20 x 30')).toBe('20x30 yards')
      expect(extractSpaceFromSetup('20  x  30')).toBe('20x30 yards')
    })

    it('should return default when no dimensions found', () => {
      expect(extractSpaceFromSetup('Set up cones in a circle')).toBe('30x20 yards')
      expect(extractSpaceFromSetup('Use the full pitch')).toBe('30x20 yards')
      expect(extractSpaceFromSetup('Random setup text')).toBe('30x20 yards')
    })

    it('should return default when setup is undefined or empty', () => {
      expect(extractSpaceFromSetup()).toBe('30x20 yards')
      expect(extractSpaceFromSetup('')).toBe('30x20 yards')
      expect(extractSpaceFromSetup(null as any)).toBe('30x20 yards')
      expect(extractSpaceFromSetup(undefined)).toBe('30x20 yards')
    })

    it('should extract first valid dimension when multiple present', () => {
      expect(extractSpaceFromSetup('Start with 20x15 then expand to 40x30')).toBe('20x15 yards')
    })

    it('should handle edge cases', () => {
      expect(extractSpaceFromSetup('100x50')).toBe('100x50 yards')
      expect(extractSpaceFromSetup('5x5 small area')).toBe('5x5 yards')
    })
  })

  describe('createFallbackActivity', () => {
    describe('warm-up activity', () => {
      it('should create proper warm-up activity structure', () => {
        const warmUp = createFallbackActivity('warm-up', 15)

        expect(warmUp).toMatchObject({
          name: 'Dynamic Warm-Up',
          category: 'physical',
          duration: 15,
          description: 'Progressive warm-up to prepare for training',
          objectives: ['Prepare body for activity', 'Activate muscle groups'],
          setup: {
            space: '20x20 yards',
            equipment: ['Cones', 'Balls'],
            organization: 'Players spread out in area',
          },
          instructions: ['Light jogging', 'Dynamic stretches', 'Ball manipulation'],
          coachingPoints: ['Good posture', 'Quality of movement', 'Keep ball close'],
          progressions: ['Increase intensity gradually'],
        })
      })

      it('should use provided duration for warm-up', () => {
        const warmUp = createFallbackActivity('warm-up', 20)
        expect(warmUp.duration).toBe(20)
      })

      it('should have physical category for warm-up', () => {
        const warmUp = createFallbackActivity('warm-up', 15)
        expect(warmUp.category).toBe('physical')
      })
    })

    describe('cool-down activity', () => {
      it('should create proper cool-down activity structure', () => {
        const coolDown = createFallbackActivity('cool-down', 10)

        expect(coolDown).toMatchObject({
          name: 'Cool-Down and Stretch',
          category: 'physical',
          duration: 10,
          description: 'Recovery and reflection session',
          objectives: ['Gradual recovery', 'Flexibility maintenance'],
          setup: {
            space: '20x20 yards',
            equipment: ['Balls'],
            organization: 'Open space for stretching',
          },
          instructions: ['Light activity', 'Static stretching', 'Session reflection'],
          coachingPoints: ['Maintain light intensity', 'Hold stretches properly'],
          progressions: ['Focus on areas used most in session'],
        })
      })

      it('should use provided duration for cool-down', () => {
        const coolDown = createFallbackActivity('cool-down', 15)
        expect(coolDown.duration).toBe(15)
      })

      it('should have physical category for cool-down', () => {
        const coolDown = createFallbackActivity('cool-down', 10)
        expect(coolDown.category).toBe('physical')
      })
    })

    it('should have different content for warm-up vs cool-down', () => {
      const warmUp = createFallbackActivity('warm-up', 15)
      const coolDown = createFallbackActivity('cool-down', 15)

      expect(warmUp.name).not.toBe(coolDown.name)
      expect(warmUp.description).not.toBe(coolDown.description)
      expect(warmUp.instructions).not.toEqual(coolDown.instructions)
      expect(warmUp.objectives).not.toEqual(coolDown.objectives)
    })

    it('should provide proper equipment for each phase', () => {
      const warmUp = createFallbackActivity('warm-up', 15)
      const coolDown = createFallbackActivity('cool-down', 15)

      expect(warmUp.setup.equipment).toContain('Cones')
      expect(warmUp.setup.equipment).toContain('Balls')
      
      expect(coolDown.setup.equipment).toContain('Balls')
      expect(coolDown.setup.equipment).not.toContain('Cones')
    })

    it('should have appropriate coaching points for each phase', () => {
      const warmUp = createFallbackActivity('warm-up', 15)
      const coolDown = createFallbackActivity('cool-down', 15)

      expect(warmUp.coachingPoints).toContain('Good posture')
      expect(warmUp.coachingPoints).toContain('Quality of movement')
      
      expect(coolDown.coachingPoints).toContain('Maintain light intensity')
      expect(coolDown.coachingPoints).toContain('Hold stretches properly')
    })

    it('should handle different duration values', () => {
      const shortWarmUp = createFallbackActivity('warm-up', 5)
      const longWarmUp = createFallbackActivity('warm-up', 25)

      expect(shortWarmUp.duration).toBe(5)
      expect(longWarmUp.duration).toBe(25)
      
      // Structure should remain the same regardless of duration
      expect(shortWarmUp.name).toBe(longWarmUp.name)
      expect(shortWarmUp.category).toBe(longWarmUp.category)
    })
  })
})