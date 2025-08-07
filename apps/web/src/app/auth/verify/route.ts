import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyMagicLink, createSession } from '@/lib/auth/magic-link'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  // Use NEXTAUTH_URL for server-side redirects (NEXT_PUBLIC vars are baked at build time)
  const appUrl = process.env.NEXTAUTH_URL || 'https://preview.clubomatic.ai'
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=missing-token', appUrl))
  }

  try {
    // Verify the magic link token
    const result = await verifyMagicLink(token)
    
    if (!result) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid-token', appUrl))
    }

    // Create session
    await createSession(result.userId, result.email)
    
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', appUrl))
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=verification-failed', appUrl))
  }
}