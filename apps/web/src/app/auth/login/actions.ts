'use server'

import { generateMagicLink } from '@/lib/auth/magic-link'

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string
  
  try {
    await generateMagicLink(email.toLowerCase())
    
    return { success: true, message: 'Check your email for a magic link to sign in!' }
  } catch (error) {
    console.error('Sign in error:', error)
    return { error: 'Failed to send magic link. Please try again.' }
  }
}