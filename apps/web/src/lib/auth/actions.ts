'use server'

import { redirect } from 'next/navigation'
import { generateMagicLink, verifyMagicLink, createSession } from './magic-link'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Input validation schemas
const signInSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
})

const registerSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  name: z.string().max(255).optional(),
  clubName: z.string().max(255).optional(),
})

// Rate limiting (simple in-memory store - in production use Redis)
// Use globalThis to persist across server action executions
const rateLimitStore = (globalThis as any).__rateLimitStore || new Map<string, { count: number; resetTime: number }>()
if (!(globalThis as any).__rateLimitStore) {
  (globalThis as any).__rateLimitStore = rateLimitStore
}

function checkRateLimit(key: string, limit: number = 5, windowMs: number = 15 * 60 * 1000): boolean {
  const now = Date.now()
  const record = rateLimitStore.get(key)
  
  if (!record || record.resetTime < now) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    console.log(`Rate limit: New record for ${key}, count: 1`)
    return true
  }
  
  if (record.count >= limit) {
    console.log(`Rate limit: Exceeded for ${key}, count: ${record.count}`)
    return false
  }
  
  record.count++
  console.log(`Rate limit: Updated for ${key}, count: ${record.count}`)
  return true
}

export async function signIn(prevState: any, formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email'),
    }

    const validatedData = signInSchema.parse(rawData)
    
    // Rate limiting by email (lower limit for testing)
    if (!checkRateLimit(`signin:${validatedData.email}`, 3)) {
      return { error: 'Too many login attempts. Please try again later.' }
    }

    await generateMagicLink(validatedData.email)
    return { success: true, message: 'Check your email for a magic link to sign in!' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || 'Invalid input' }
    }
    console.error('Sign in error:', error)
    return { error: 'Failed to send magic link' }
  }
}

export async function registerUser(prevState: any, formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email'),
      name: formData.get('name') || undefined,
      clubName: formData.get('clubName') || undefined,
    }

    const validatedData = registerSchema.parse(rawData)
    
    // Rate limiting by email
    if (!checkRateLimit(`register:${validatedData.email}`, 3)) {
      return { error: 'Too many registration attempts. Please try again later.' }
    }

    // Store registration intent
    if (validatedData.clubName) {
      await storeRegistrationIntent(validatedData.email, {
        name: validatedData.name,
        clubName: validatedData.clubName,
      })
    }

    // Send magic link
    await generateMagicLink(validatedData.email)
    
    return { success: true, message: 'Check your email to complete registration!' }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message || 'Invalid input' }
    }
    console.error('Registration error:', error)
    return { error: 'Failed to send magic link' }
  }
}

export async function verifyToken(token: string) {
  try {
    const result = await verifyMagicLink(token)
    
    if (!result) {
      return { error: 'Invalid or expired link' }
    }
    
    // Check for registration intent
    const intent = await getRegistrationIntent(result.email)
    if (intent) {
      // Complete registration
      await prisma.$transaction(async (tx) => {
        // Update user name if provided
        if (intent.name) {
          await tx.user.update({
            where: { id: result.userId },
            data: { name: intent.name },
          })
        }
        
        // Create club and association
        if (intent.clubName) {
          const club = await tx.club.create({
            data: {
              name: intent.clubName,
            },
          })
          
          await tx.userClub.create({
            data: {
              userId: result.userId,
              clubId: club.id,
              role: 'admin',
            },
          })
        }
        
        // Clear registration intent
        await clearRegistrationIntent(result.email)
      })
    }
    
    // Create session
    await createSession(result.userId, result.email)
    
    redirect('/dashboard')
  } catch (error) {
    // Re-throw redirect errors
    if (error instanceof Error && error.message.includes('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Token verification error:', error)
    return { error: 'Invalid or expired link' }
  }
}

// Server-only functions moved to auth/server.ts to avoid action registration conflicts

// Registration intent helpers (store in Redis in production)
const registrationIntents = new Map<string, any>()

async function storeRegistrationIntent(email: string, data: any) {
  registrationIntents.set(email, {
    ...data,
    timestamp: Date.now(),
  })
}

async function getRegistrationIntent(email: string) {
  const intent = registrationIntents.get(email)
  if (!intent) return null
  
  // Check if intent is expired (1 hour)
  if (Date.now() - intent.timestamp > 60 * 60 * 1000) {
    registrationIntents.delete(email)
    return null
  }
  
  return intent
}

async function clearRegistrationIntent(email: string) {
  registrationIntents.delete(email)
}