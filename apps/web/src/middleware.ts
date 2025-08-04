import { NextResponse, type NextRequest } from 'next/server'

const publicPaths = [
  '/auth/login',
  '/auth/signup',
  '/auth/verify',
  '/auth/verify-request',
  '/auth/error',
  '/api/health',
  '/api/test-db',
  '/api/trpc',
]

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  
  // Allow public paths
  if (publicPaths.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }
  
  // Check session cookie for protected routes
  if (path.startsWith('/dashboard')) {
    const session = request.cookies.get('session')
    
    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (except auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}