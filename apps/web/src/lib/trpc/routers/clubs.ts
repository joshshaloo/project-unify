import { z } from 'zod';
import { 
  createTRPCRouter, 
  protectedProcedure,
  publicProcedure
} from '../procedures';
import { TRPCError } from '@trpc/server';
import { ROLES, hasMinimumRole, getUserRoleInClub } from '../../auth/roles';

export const clubsRouter = createTRPCRouter({
  // Get all clubs for the current user
  getMyClubs: protectedProcedure.query(async ({ ctx }) => {
    const userClubs = await ctx.prisma.userClub.findMany({
      where: {
        userId: ctx.user.id,
        status: 'active',
      },
      include: {
        club: true,
      },
    });

    return userClubs.map((uc: any) => ({
      ...uc.club,
      role: uc.role,
      joinedAt: uc.joinedAt,
    }));
  }),

  // Get a specific club with role check
  getClub: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userClub = await ctx.prisma.userClub.findFirst({
        where: {
          userId: ctx.user.id,
          clubId: input.clubId,
          status: 'active',
        },
        include: {
          club: true,
        },
      });

      if (!userClub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this club',
        });
      }

      return {
        ...userClub.club,
        role: userClub.role,
        joinedAt: userClub.joinedAt,
      };
    }),

  // Create a new club (any authenticated user can create a club)
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Create the club and make the user an admin
      const club = await ctx.prisma.club.create({
        data: {
          name: input.name,
          logoUrl: input.logoUrl,
          primaryColor: input.primaryColor,
          userClubs: {
            create: {
              userId: ctx.user.id,
              role: ROLES.ADMIN,
              status: 'active',
            },
          },
        },
        include: {
          userClubs: true,
        },
      });

      return club;
    }),

  // Update club settings (admin only)
  update: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        name: z.string().min(1).optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        settings: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin of this club
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.ADMIN)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only club admins can update club settings',
        });
      }

      const { clubId, ...updateData } = input;
      
      const club = await ctx.prisma.club.update({
        where: { id: clubId },
        data: updateData,
      });

      return club;
    }),

  // Invite a user to the club (admin or head coach only)
  inviteUser: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        email: z.string().email(),
        role: z.enum([ROLES.ADMIN, ROLES.HEAD_COACH, ROLES.ASSISTANT_COACH, ROLES.PARENT]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to invite
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole || !hasMinimumRole(userRole, ROLES.HEAD_COACH)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins and head coaches can invite users',
        });
      }

      // Additional check: head coaches can't invite admins
      if (userRole === ROLES.HEAD_COACH && input.role === ROLES.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Head coaches cannot invite admin users',
        });
      }

      // Create invitation
      const invitation = await ctx.prisma.invitation.create({
        data: {
          clubId: input.clubId,
          email: input.email,
          role: input.role,
          createdBy: ctx.user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });

      // TODO: Send invitation email using Supabase

      return invitation;
    }),

  // Get club members (any club member can view)
  getMembers: protectedProcedure
    .input(z.object({ clubId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Check if user is member of this club
      const userClub = await ctx.prisma.userClub.findFirst({
        where: {
          userId: ctx.user.id,
          clubId: input.clubId,
          status: 'active',
        },
      });

      if (!userClub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a member of this club to view members',
        });
      }

      const members = await ctx.prisma.userClub.findMany({
        where: {
          clubId: input.clubId,
          status: 'active',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
      });

      return members.map((member: any) => ({
        ...member.user,
        role: member.role,
        joinedAt: member.joinedAt,
      }));
    }),

  // Remove a member (admin only)
  removeMember: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      const userRole = getUserRoleInClub(ctx.user.clubs || [], input.clubId);
      
      if (!userRole || userRole !== ROLES.ADMIN) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can remove members',
        });
      }

      // Can't remove yourself
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot remove yourself from the club',
        });
      }

      await ctx.prisma.userClub.update({
        where: {
          userId_clubId: {
            userId: input.userId,
            clubId: input.clubId,
          },
        },
        data: {
          status: 'inactive',
        },
      });

      return { success: true };
    }),

  // Accept invitation
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { token: input.token },
      });

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invalid invitation',
        });
      }

      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has expired',
        });
      }

      if (invitation.usedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been used',
        });
      }

      // Check if email matches
      if (invitation.email !== ctx.user.email) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This invitation is for a different email address',
        });
      }

      // Create user-club relationship
      await ctx.prisma.$transaction([
        ctx.prisma.userClub.create({
          data: {
            userId: ctx.user.id,
            clubId: invitation.clubId,
            role: invitation.role,
            status: 'active',
          },
        }),
        ctx.prisma.invitation.update({
          where: { id: invitation.id },
          data: {
            usedAt: new Date(),
            usedByEmail: ctx.user.email,
          },
        }),
      ]);

      return { success: true };
    }),
});