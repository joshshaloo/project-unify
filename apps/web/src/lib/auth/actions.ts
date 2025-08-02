'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const inviteToken = formData.get('invite') as string
  let invitation = null

  // If there's an invite token, validate it
  if (inviteToken) {
    invitation = await prisma.invitation.findUnique({
      where: { token: inviteToken },
      include: { club: true }
    })

    if (!invitation) {
      return { error: 'Invalid invitation token' }
    }

    if (invitation.usedAt) {
      return { error: 'This invitation has already been used' }
    }

    if (new Date() > invitation.expiresAt) {
      return { error: 'This invitation has expired' }
    }

    // Verify email matches if invitation is email-specific
    if (invitation.email && invitation.email !== data.email) {
      return { error: 'This invitation is for a different email address' }
    }
  }

  const { data: authData, error: authError } = await supabase.auth.signUp(data)

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    // Create user in our database with transaction
    try {
        await prisma.$transaction(async (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => {
          // Create user
          const user = await tx.user.create({
            data: {
              email: authData.user!.email!,
              supabaseId: authData.user!.id,
            name: formData.get('name') as string || undefined,
          }
        })

        // If there's an invitation, create club association
        if (invitation) {
          await tx.userClub.create({
            data: {
              userId: user.id,
              clubId: invitation.clubId,
              role: invitation.role,
              status: 'active'
            }
          })

          // Mark invitation as used
          await tx.invitation.update({
            where: { id: invitation.id },
            data: {
              usedAt: new Date(),
              usedByEmail: data.email
            }
          })
        }
      })
    } catch (dbError) {
      console.error('Failed to create user in database:', dbError)
      // Continue anyway - user can be created later
    }
  }

  revalidatePath('/', 'layout')
  redirect('/auth/verify-email')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  // Get full user data from our database
  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
    include: {
      clubs: {
        include: {
          club: true
        }
      }
    }
  })

  return dbUser
}