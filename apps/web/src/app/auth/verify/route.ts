import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { verifyMagicLink, createSession } from '@/lib/auth/magic-link'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login?error=missing-token', request.url))
  }

  try {
    // Verify the magic link token
    const result = await verifyMagicLink(token)
    
    if (!result) {
      return NextResponse.redirect(new URL('/auth/login?error=invalid-token', request.url))
    }

    // Create session
    await createSession(result.userId, result.email)
    
    // Redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/auth/login?error=verification-failed', request.url))
  }
}