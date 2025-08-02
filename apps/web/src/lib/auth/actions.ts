'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Input validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(1, 'Password is required').max(255),
})

const signupSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(255),
  name: z.string().min(1, 'Name is required').max(255).optional(),
  invite: z.string().max(255).optional(),
})

// Rate limiting (simple in-memory store - in production use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(key: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }
  
  if (record.count >= limit) {
    return false
  }
  
  record.count++
  return true
}

export async function login(formData: FormData) {
  try {
    // Extract and validate input
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
    }

    const validatedData = loginSchema.parse(rawData)
    
    // Rate limiting by email
    if (!checkRateLimit(`login:${validatedData.email}`, 5)) {
      return { error: 'Too many login attempts. Please try again later.' }
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword(validatedData)

    if (error) {
      return { error: 'Invalid email or password' } // Generic error message for security
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || 'Invalid input' }
    }
    console.error('Login error:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function signup(formData: FormData) {
  try {
    // Extract and validate input
    const rawData = {
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      invite: formData.get('invite'),
    }

    const validatedData = signupSchema.parse(rawData)
    
    // Rate limiting by email
    if (!checkRateLimit(`signup:${validatedData.email}`, 3)) {
      return { error: 'Too many signup attempts. Please try again later.' }
    }

    const supabase = await createClient()
    let invitation = null

    // If there's an invite token, validate it
    if (validatedData.invite) {
      invitation = await prisma.invitation.findUnique({
        where: { token: validatedData.invite },
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
      if (invitation.email && invitation.email !== validatedData.email) {
        return { error: 'This invitation is for a different email address' }
      }
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name || '',
        }
      }
    })

    if (authError) {
      return { error: 'Failed to create account. Please try again.' } // Generic error for security
    }

    if (authData.user) {
      // Create user in our database with transaction
      await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: authData.user!.email!,
            supabaseId: authData.user!.id,
            name: validatedData.name || null,
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
              usedByEmail: validatedData.email
            }
          })
        }
      })
    }

    revalidatePath('/', 'layout')
    redirect('/auth/verify-email')
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || 'Invalid input' }
    }
    console.error('Signup error:', error)
    return { error: 'An unexpected error occurred' }
  }
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