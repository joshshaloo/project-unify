import { openai, type SessionGenerationParams, type GeneratedSession } from './openai';
import { z } from 'zod';

// Schema for validating AI response
const generatedDrillSchema = z.object({
  name: z.string(),
  category: z.enum(['technical', 'tactical', 'physical', 'mental']),
  duration: z.number(),
  description: z.string(),
  objectives: z.array(z.string()),
  setup: z.object({
    space: z.string(),
    equipment: z.array(z.string()),
    organization: z.string(),
  }),
  instructions: z.array(z.string()),
  coachingPoints: z.array(z.string()),
  progressions: z.array(z.string()).optional(),
});

const generatedSessionSchema = z.object({
  title: z.string(),
  objectives: z.array(z.string()),
  warmUp: generatedDrillSchema,
  mainActivities: z.array(generatedDrillSchema),
  coolDown: generatedDrillSchema,
  notes: z.string(),
  totalDuration: z.number(),
});

export async function generateTrainingSession(
  params: SessionGenerationParams
): Promise<GeneratedSession> {
  const systemPrompt = `You are an expert youth soccer coach with UEFA A License certification. 
Create detailed, age-appropriate training sessions that focus on player development, fun, and skill progression.
Consider the principles of youth development, including appropriate work-rest ratios, varied activities, and positive coaching methods.`;

  const userPrompt = `Create a ${params.duration}-minute ${params.sessionType} training session for a ${params.ageGroup} team with ${params.skillLevel} skill level.
${params.focus ? `Focus areas: ${params.focus.join(', ')}` : ''}
${params.playerCount ? `Expected players: ${params.playerCount}` : ''}
${params.equipment ? `Available equipment: ${params.equipment.join(', ')}` : 'Standard equipment available'}

Please structure the session with:
1. Warm-up (10-15% of total time)
2. Main activities (70-75% of total time) - include 2-3 progressive drills
3. Cool-down/Game (10-15% of total time)

For each drill, provide:
- Clear objectives
- Detailed setup and space requirements
- Step-by-step instructions
- Key coaching points
- Progressions to increase/decrease difficulty

Ensure all activities are age-appropriate and focus on fun while developing skills.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI');
    }

    const parsedResponse = JSON.parse(response);
    const validatedSession = generatedSessionSchema.parse(parsedResponse);

    return validatedSession;
  } catch (error) {
    console.error('Error generating session:', error);
    
    // Fallback to a basic session structure
    return createFallbackSession(params);
  }
}

function createFallbackSession(params: SessionGenerationParams): GeneratedSession {
  const warmUpDuration = Math.floor(params.duration * 0.15);
  const coolDownDuration = Math.floor(params.duration * 0.15);
  const mainDuration = params.duration - warmUpDuration - coolDownDuration;
  const drillDuration = Math.floor(mainDuration / 3);

  return {
    title: `${params.ageGroup} ${params.sessionType.replace('_', ' ')} Session`,
    objectives: [
      'Improve technical skills',
      'Develop tactical understanding',
      'Enhance physical fitness',
      'Foster teamwork and communication',
    ],
    warmUp: {
      name: 'Dynamic Warm-Up with Ball',
      category: 'physical',
      duration: warmUpDuration,
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
    },
    mainActivities: [
      {
        name: 'Technical Skills Station',
        category: 'technical',
        duration: drillDuration,
        description: 'Focused technical development',
        objectives: ['Improve ball control', 'Enhance passing accuracy'],
        setup: {
          space: '30x20 yards',
          equipment: ['Cones', 'Balls', 'Bibs'],
          organization: 'Set up stations for different skills',
        },
        instructions: [
          'Divide players into small groups',
          'Rotate through stations every 5 minutes',
          'Focus on quality over quantity',
        ],
        coachingPoints: [
          'First touch direction',
          'Head up when possible',
          'Use both feet',
        ],
      },
      {
        name: 'Small-Sided Game',
        category: 'tactical',
        duration: drillDuration,
        description: 'Game-like situations to apply skills',
        objectives: ['Apply technical skills', 'Develop decision making'],
        setup: {
          space: '40x30 yards',
          equipment: ['Cones', 'Balls', 'Bibs', 'Goals'],
          organization: 'Create small-sided game areas',
        },
        instructions: [
          'Play 4v4 or 5v5 games',
          'Implement specific rules to encourage focus areas',
          'Rotate teams every 5-7 minutes',
        ],
        coachingPoints: [
          'Communication',
          'Movement off the ball',
          'Quick decision making',
        ],
      },
      {
        name: 'Skill Challenge',
        category: 'technical',
        duration: drillDuration,
        description: 'Competitive skill-based activities',
        objectives: ['Refine technique under pressure', 'Build confidence'],
        setup: {
          space: '30x30 yards',
          equipment: ['Cones', 'Balls', 'Goals'],
          organization: 'Set up challenge courses',
        },
        instructions: [
          'Create competitive challenges',
          'Track scores or times',
          'Encourage peer support',
        ],
        coachingPoints: [
          'Maintain technique under pressure',
          'Positive reinforcement',
          'Celebrate effort and improvement',
        ],
      },
    ],
    coolDown: {
      name: 'Cool-Down Game and Stretch',
      category: 'physical',
      duration: coolDownDuration,
      description: 'Fun game followed by stretching',
      objectives: ['Gradual recovery', 'Flexibility maintenance', 'Session reflection'],
      setup: {
        space: '20x20 yards',
        equipment: ['Balls'],
        organization: 'Open space for free play and stretching',
      },
      instructions: [
        'Start with low-intensity possession game',
        'Transition to static stretching',
        'Include session reflection and feedback',
      ],
      coachingPoints: [
        'Maintain light intensity',
        'Hold stretches appropriately',
        'Positive session summary',
      ],
    },
    notes: 'Adapt activities based on player engagement and energy levels. Ensure adequate water breaks.',
    totalDuration: params.duration,
  };
}