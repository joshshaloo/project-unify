import { z } from 'zod'
import { createTRPCRouter, publicProcedure, protectedProcedure } from '../procedures'
import { TRPCError } from '@trpc/server'
import { createClient } from '@/lib/supabase/server'
import type { PrismaClient } from '@prisma/client'

export const authRouter = createTRPCRouter({
  // Get the current user
  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user
  }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        preferredLanguage: z.string().optional(),
        notificationSettings: z.record(z.boolean()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
      })
      return updated
    }),

  // Complete onboarding
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        role: z.enum(['head_coach', 'assistant_coach', 'parent', 'admin']),
        clubName: z.string().min(1).optional(), // For creating a new club
        inviteCode: z.string().optional(), // For joining existing club
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Start a transaction
      const result = await ctx.prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
        // Update user profile
        const updatedUser = await tx.user.update({
          where: { id: ctx.user.id },
          data: {
            name: input.name,
            onboardingCompleted: true,
          },
        })

        // Handle club association
        if (input.clubName) {
          // Create a new club
          const club = await tx.club.create({
            data: {
              name: input.clubName,
              subscription: 'trial',
              settings: {},
            },
          })

          // Add user to club
          await tx.userClub.create({
            data: {
              userId: ctx.user.id,
              clubId: club.id,
              role: input.role,
              status: 'active',
            },
          })
        } else if (input.inviteCode) {
          // TODO: Implement invite code logic
          throw new TRPCError({
            code: 'NOT_IMPLEMENTED',
            message: 'Invite codes not yet implemented',
          })
        }

        return updatedUser
      })

      return result
    }),

  // Get user's clubs
  myClubs: protectedProcedure.query(async ({ ctx }) => {
    const clubs = await ctx.prisma.userClub.findMany({
      where: { userId: ctx.user.id },
      include: {
        club: {
          include: {
            teams: true,
            _count: {
              select: {
                userClubs: true,
                teams: true,
                sessions: true,
              },
            },
          },
        },
      },
    })
    return clubs
  }),

  // Sign out (client-side helper)
  signOut: protectedProcedure.mutation(async () => {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return { success: true }
  }),
})