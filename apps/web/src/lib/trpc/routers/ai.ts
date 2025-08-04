import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../procedures';
import { TRPCError } from '@trpc/server';
import { generateTrainingSession } from '../../ai/session-generator';
import { n8nClient } from '../../ai/n8n-client';
import { hasMinimumRole, getUserRoleInClub, ROLES } from '../../auth/roles';

export const aiRouter = createTRPCRouter({
  generateSession: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        teamId: z.string(),
        date: z.date(),
        duration: z.number().min(30).max(180), // 30-180 minutes
        sessionType: z.enum(['training', 'match_prep', 'skills']),
        focus: z.array(z.string()).optional(),
        equipment: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has coach role in the club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ASSISTANT_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can generate training sessions',
        });
      }

      // Get team details
      const team = await ctx.prisma.team.findUnique({
        where: { id: input.teamId },
        include: {
          players: true,
        },
      });

      if (!team || team.clubId !== input.clubId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      // Get recent sessions for context
      const recentSessions = await ctx.prisma.session.findMany({
        where: {
          teamId: input.teamId,
          date: {
            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 2 weeks
          },
        },
        orderBy: { date: 'desc' },
        take: 5,
      });

      try {
        // Generate the session using Coach Winston n8n workflow
        const n8nResponse = await n8nClient.generateSession({
          teamId: input.teamId,
          duration: input.duration,
          focusAreas: input.focus || [],
          ageGroup: team.ageGroup,
          skillLevel: team.skillLevel,
          playerCount: team.players.length,
          availableEquipment: input.equipment || ['cones', 'balls', 'goals'],
          weatherConditions: 'good', // TODO: Add weather input parameter
        });

        if (!n8nResponse.success || !n8nResponse.sessionPlan) {
          throw new Error(n8nResponse.error?.message || 'Failed to generate session');
        }

        // Convert n8n response to our internal format
        const warmUpActivity = n8nResponse.sessionPlan.activities.find(a => a.phase === 'warm-up');
        const coolDownActivity = n8nResponse.sessionPlan.activities.find(a => a.phase === 'cool-down');
        const mainActivities = n8nResponse.sessionPlan.activities.filter(a => 
          ['technical', 'tactical', 'game'].includes(a.phase)
        );

        const generatedSession = {
          title: n8nResponse.sessionPlan.sessionTitle,
          objectives: n8nResponse.sessionPlan.focusAreas || [],
          warmUp: warmUpActivity ? {
            name: warmUpActivity.name,
            category: 'physical' as const,
            duration: warmUpActivity.duration,
            description: warmUpActivity.description,
            objectives: warmUpActivity.coachingPoints?.slice(0, 2) || ['Prepare body for activity'],
            setup: {
              space: extractSpaceFromSetup(warmUpActivity.setup),
              equipment: warmUpActivity.equipment || ['cones', 'balls'],
              organization: warmUpActivity.setup || 'Players spread out in area',
            },
            instructions: warmUpActivity.instructions ? [warmUpActivity.instructions] : [],
            coachingPoints: warmUpActivity.coachingPoints || [],
            progressions: warmUpActivity.progressions || [],
          } : createFallbackActivity('warm-up', 15),
          mainActivities: mainActivities.map(activity => ({
            name: activity.name,
            category: mapPhaseToCategory(activity.phase),
            duration: activity.duration,
            description: activity.description,
            objectives: activity.coachingPoints?.slice(0, 2) || ['Develop skills'],
            setup: {
              space: extractSpaceFromSetup(activity.setup),
              equipment: activity.equipment || ['cones', 'balls'],
              organization: activity.setup || 'Standard setup',
            },
            instructions: activity.instructions ? [activity.instructions] : [],
            coachingPoints: activity.coachingPoints || [],
            progressions: activity.progressions || [],
          })),
          coolDown: coolDownActivity ? {
            name: coolDownActivity.name,
            category: 'physical' as const,
            duration: coolDownActivity.duration,
            description: coolDownActivity.description,
            objectives: ['Gradual recovery', 'Session reflection'],
            setup: {
              space: extractSpaceFromSetup(coolDownActivity.setup),
              equipment: coolDownActivity.equipment || ['balls'],
              organization: coolDownActivity.setup || 'Open space for recovery',
            },
            instructions: coolDownActivity.instructions ? [coolDownActivity.instructions] : [],
            coachingPoints: coolDownActivity.coachingPoints || [],
            progressions: coolDownActivity.progressions || [],
          } : createFallbackActivity('cool-down', 10),
          notes: n8nResponse.sessionPlan.coachNotes || 'Generated by Coach Winston AI',
          totalDuration: n8nResponse.sessionPlan.totalDuration,
        };

        const session = await ctx.prisma.session.create({
          data: {
            clubId: input.clubId,
            teamId: input.teamId,
            createdByUserId: ctx.user.id,
            title: generatedSession.title,
            date: input.date,
            duration: input.duration,
            type: 'training',
            status: 'draft',
            plan: {
              ...generatedSession,
              n8nMetadata: {
                sessionId: n8nResponse.sessionId,
                requestId: n8nResponse.metadata?.requestId,
                generatedAt: n8nResponse.metadata?.generatedAt,
              },
            } as any,
            aiGenerated: true,
          },
        });

        return {
          session,
          generatedPlan: generatedSession,
          n8nMetadata: n8nResponse.metadata,
        };

      } catch (error) {
        console.error('N8N session generation failed, falling back to direct AI:', error);
        
        // Fallback to original AI generation method
        const generatedSession = await generateTrainingSession({
          teamId: input.teamId,
          ageGroup: team.ageGroup,
          skillLevel: team.skillLevel,
          duration: input.duration,
          sessionType: input.sessionType,
          focus: input.focus,
          playerCount: team.players.length,
          equipment: input.equipment,
          previousSessions: recentSessions.map((s: any) => ({
            date: s.date,
            focus: s.plan && typeof s.plan === 'object' && 'focus' in s.plan 
              ? (s.plan.focus as string[]) 
              : [],
            drills: s.plan && typeof s.plan === 'object' && 'drills' in s.plan
              ? (s.plan.drills as any[]).map((d: any) => d.name)
              : [],
          })),
        });

        const session = await ctx.prisma.session.create({
          data: {
            clubId: input.clubId,
            teamId: input.teamId,
            createdByUserId: ctx.user.id,
            title: generatedSession.title,
            date: input.date,
            duration: input.duration,
            type: 'training',
            status: 'draft',
            plan: {
              ...generatedSession,
              fallbackMetadata: {
                fallbackUsed: true,
                fallbackReason: error instanceof Error ? error.message : 'Unknown error',
              },
            } as any,
            aiGenerated: true,
          },
        });

        return {
          session,
          generatedPlan: generatedSession,
          fallbackUsed: true,
        };
      }
    }),

  regenerateSection: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        section: z.enum(['warmUp', 'mainActivities', 'coolDown']),
        requirements: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the session
      const session = await ctx.prisma.session.findUnique({
        where: { id: input.sessionId },
        include: { team: true },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Check permissions
      const userRole = getUserRoleInClub(ctx.user.clubs || [], session.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ASSISTANT_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can modify training sessions',
        });
      }

      // For now, return a message that this feature is coming soon
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Section regeneration is coming soon',
      });
    }),

  suggestDrills: protectedProcedure
    .input(
      z.object({
        ageGroup: z.string(),
        category: z.enum(['technical', 'tactical', 'physical', 'mental']),
        focus: z.string(),
        playerCount: z.number(),
        duration: z.number(),
      })
    )
    .query(async ({ ctx: _ctx, input }) => {
      // This would typically call the AI to suggest drills
      // For now, return mock suggestions
      return {
        drills: [
          {
            name: `${input.focus} Development Drill`,
            category: input.category,
            duration: input.duration,
            description: `A drill focused on improving ${input.focus} for ${input.ageGroup} players`,
            difficulty: 'intermediate',
          },
        ],
      };
    }),
});

// Helper function to map n8n phase to our category system
function mapPhaseToCategory(phase: string): 'technical' | 'tactical' | 'physical' | 'mental' {
  switch (phase) {
    case 'technical':
      return 'technical';
    case 'tactical':
      return 'tactical';
    case 'game':
      return 'tactical'; // Game phases are typically tactical
    default:
      return 'technical'; // Default fallback
  }
}

// Helper function to extract space dimensions from setup text
function extractSpaceFromSetup(setup?: string): string {
  if (!setup) return '30x20 yards';
  
  // Look for common space patterns like "20x30", "20 x 30", "20x30 yards", etc.
  const spaceMatch = setup.match(/(\d+)\s*x\s*(\d+)(?:\s*(?:yards?|meters?|m))?/i);
  if (spaceMatch) {
    return `${spaceMatch[1]}x${spaceMatch[2]} yards`;
  }
  
  // Default if no space found
  return '30x20 yards';
}

// Helper function to create fallback activities
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
  };
  
  return activities[phase];
}