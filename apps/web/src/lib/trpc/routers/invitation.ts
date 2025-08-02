import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../procedures'
import { TRPCError } from '@trpc/server'
import { createInvitation, getInvitationsByClub, cancelInvitation } from '@/lib/auth/invitations'

export const invitationRouter = createTRPCRouter({
  // Create a new invitation
  create: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
        email: z.string().email().optional(),
        role: z.enum(['admin', 'head_coach', 'assistant_coach', 'parent']),
        expiresInDays: z.number().min(1).max(30).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user has permission to invite to this club
      const userClub = ctx.user?.clubs?.find((uc: any) => uc.clubId === input.clubId)
      
      if (!userClub || !['admin', 'head_coach'].includes(userClub.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create invitations for this club',
        })
      }

      const result = await createInvitation({
        ...input,
        createdBy: ctx.user.id,
      })

      return result
    }),

  // List invitations for a club
  list: protectedProcedure
    .input(
      z.object({
        clubId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if user belongs to this club
      const userClub = ctx.user?.clubs?.find((uc: any) => uc.clubId === input.clubId)
      
      if (!userClub) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have access to this club',
        })
      }

      const invitations = await getInvitationsByClub(input.clubId)
      
      // Filter out sensitive information for non-admins
      if (!['admin', 'head_coach'].includes(userClub.role)) {
        return invitations.map((inv: typeof invitations[0]) => ({
          ...inv,
          email: inv.email ? '***' : '',
          token: '***',
        }))
      }

      return invitations
    }),

  // Cancel an invitation
  cancel: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the invitation to check permissions
      const invitation = await ctx.prisma.invitation.findUnique({
        where: { id: input.invitationId },
      })

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        })
      }

      // Check if user has permission
      const userClub = ctx.user?.clubs?.find((uc: any) => uc.clubId === invitation.clubId)
      
      if (!userClub || !['admin', 'head_coach'].includes(userClub.role)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this invitation',
        })
      }

      await cancelInvitation(input.invitationId)

      return { success: true }
    }),
})