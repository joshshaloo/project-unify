// Server-only functions (not server actions)
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
export async function getSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session')
  
  if (!sessionToken) {
    return null
  }
  
  try {
    const decoded = jwt.verify(sessionToken.value, process.env.NEXTAUTH_SECRET!) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        clubs: {
          include: {
            club: true,
          },
        },
      },
    })
    
    return user
  } catch {
    return null
  }
}

// Alias for getSession to maintain compatibility
export const getUser = getSession