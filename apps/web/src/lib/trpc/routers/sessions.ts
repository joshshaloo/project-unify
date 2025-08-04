import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../procedures';
import { TRPCError } from '@trpc/server';
import { hasMinimumRole, getUserRoleInClub, ROLES } from '../../auth/roles';

export const sessionsRouter = createTRPCRouter({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.prisma.session.findUnique({
        where: { id: input.id },
        include: {
          club: true,
          team: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          attendances: {
            include: {
              player: true,
            },
          },
        },
      });

      if (!session) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Check if user has access to this session's club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], session.clubId);
      
      if (!userRole) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      return session;
    }),

  getByTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get team to check club access
      const team = await ctx.prisma.team.findUnique({
        where: { id: input.teamId },
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

      const sessions = await ctx.prisma.session.findMany({
        where: {
          teamId: input.teamId,
        },
        include: {
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              attendances: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      return sessions;
    }),

  getByClub: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
        status: z.enum(['draft', 'planned', 'completed', 'cancelled']).optional(),
        teamId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user has access to this club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Access denied',
        });
      }

      const whereClause: any = {
        clubId: input.clubId,
      };

      if (input.status) {
        whereClause.status = input.status;
      }

      if (input.teamId) {
        whereClause.teamId = input.teamId;
      }

      const sessions = await ctx.prisma.session.findMany({
        where: whereClause,
        include: {
          team: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              attendances: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        take: input.limit,
        skip: input.offset,
      });

      return sessions;
    }),

  create: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        teamId: z.string(),
        title: z.string().min(1),
        date: z.date(),
        duration: z.number().min(30).max(180),
        type: z.enum(['training', 'match', 'tournament']),
        location: z.string().optional(),
        notes: z.string().optional(),
        plan: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has coach role in the club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ASSISTANT_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can create sessions',
        });
      }

      // Verify team belongs to club
      const team = await ctx.prisma.team.findUnique({
        where: { id: input.teamId },
      });

      if (!team || team.clubId !== input.clubId) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Team not found',
        });
      }

      const session = await ctx.prisma.session.create({
        data: {
          clubId: input.clubId,
          teamId: input.teamId,
          createdByUserId: ctx.user.id,
          title: input.title,
          date: input.date,
          duration: input.duration,
          type: input.type,
          location: input.location,
          notes: input.notes,
          plan: input.plan || {},
        },
        include: {
          team: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return session;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        date: z.date().optional(),
        duration: z.number().min(30).max(180).optional(),
        type: z.enum(['training', 'match', 'tournament']).optional(),
        status: z.enum(['draft', 'planned', 'completed', 'cancelled']).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
        plan: z.any().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Get session to check club access
      const existingSession = await ctx.prisma.session.findUnique({
        where: { id },
      });

      if (!existingSession) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Check if user has coach role in the club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], existingSession.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ASSISTANT_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can update sessions',
        });
      }

      const session = await ctx.prisma.session.update({
        where: { id },
        data: updateData,
        include: {
          team: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return session;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Get session to check club access
      const existingSession = await ctx.prisma.session.findUnique({
        where: { id: input.id },
      });

      if (!existingSession) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Check if user has coach role in the club or is the creator
      const userRole = getUserRoleInClub(ctx.user.clubs || [], existingSession.clubId);
      const isCreator = existingSession.createdByUserId === ctx.user.id;
      
      if (!userRole || (!hasMinimumRole(userRole, ROLES.ASSISTANT_COACH) && !isCreator)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches or session creators can delete sessions',
        });
      }

      await ctx.prisma.session.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['draft', 'planned', 'completed', 'cancelled']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get session to check club access
      const existingSession = await ctx.prisma.session.findUnique({
        where: { id: input.id },
      });

      if (!existingSession) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Session not found',
        });
      }

      // Check if user has coach role in the club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], existingSession.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ASSISTANT_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only coaches can update session status',
        });
      }

      const session = await ctx.prisma.session.update({
        where: { id: input.id },
        data: { status: input.status },
        include: {
          team: true,
          createdBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });

      return session;
    }),
});