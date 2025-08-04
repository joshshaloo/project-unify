import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../procedures';
import { TRPCError } from '@trpc/server';
import { hasMinimumRole, getUserRoleInClub, ROLES } from '../../auth/roles';

export const teamsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const team = await ctx.prisma.team.findUnique({
        where: { id: input.id },
        include: {
          club: true,
          players: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      });

      if (!team) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      // Check if user has access to this team's club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], team.clubId);
      
      if (!userRole) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      return team;
    }),

  getByClub: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user has access to this club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const teams = await ctx.prisma.team.findMany({
        where: {
          clubId: input.clubId,
          isActive: true,
        },
        include: {
          players: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return teams;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        name: z.string().min(1),
        ageGroup: z.string(),
        skillLevel: z.enum(['beginner', 'intermediate', 'advanced']),
        season: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has coach role in the club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ASSISTANT_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can create teams',
        });
      }

      const team = await ctx.prisma.team.create({
        data: {
          clubId: input.clubId,
          name: input.name,
          ageGroup: input.ageGroup,
          skillLevel: input.skillLevel,
          season: input.season,
        },
        include: {
          players: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      });

      return team;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        ageGroup: z.string().optional(),
        skillLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        season: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get team to check club access
      const existingTeam = await ctx.prisma.team.findUnique({
        where: { id },
      });

      if (!existingTeam) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      // Check if user has coach role in the club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], existingTeam.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ASSISTANT_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can update teams',
        });
      }

      const team = await ctx.prisma.team.update({
        where: { id },
        data: updateData,
        include: {
          players: true,
          _count: {
            select: {
              sessions: true,
            },
          },
        },
      });

      return team;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get team to check club access
      const existingTeam = await ctx.prisma.team.findUnique({
        where: { id: input.id },
      });

      if (!existingTeam) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      // Check if user has admin role in the club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], existingTeam.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.HEAD_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only head coaches can delete teams',
        });
      }

      // Soft delete by setting isActive to false
      const team = await ctx.prisma.team.update({
        where: { id: input.id },
        data: { isActive: false },
      });

      return team;
    }),
});