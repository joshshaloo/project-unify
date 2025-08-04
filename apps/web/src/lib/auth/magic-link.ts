import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { sendEmail } from '@/lib/email/send'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret'
const TOKEN_EXPIRY = 15 * 60 * 1000 // 15 minutes
const SESSION_EXPIRY = 30 * 24 * 60 * 60 * 1000 // 30 days

export interface MagicLinkPayload {
  email: string
  token: string
  expiresAt: Date
}

export interface SessionPayload {
  userId: string
  email: string
}

// Generate a magic link token
export async function generateMagicLink(email: string): Promise<string> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY)

  // Store the token in database
  await prisma.magicLink.create({
    data: {
      email: email.toLowerCase(),
      token,
      expiresAt,
    }
  })

  // Send email
  const magicLinkUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/auth/verify?token=${token}`
  
  await sendEmail({
    to: email,
    subject: 'Your login link for Soccer Project Unify',
    html: `
      <div>
        <h2>Login to Soccer Project Unify</h2>
        <p>Click the link below to log in:</p>
        <a href="${magicLinkUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">
          Log In
        </a>
        <p>Or copy this link: ${magicLinkUrl}</p>
        <p>This link will expire in 15 minutes.</p>
      </div>
    `
  })

  return token
}

// Verify a magic link token
export async function verifyMagicLink(token: string): Promise<{ email: string; userId: string } | null> {
  const magicLink = await prisma.magicLink.findUnique({
    where: { token },
  })

  if (!magicLink) {
    return null
  }

  // Check if expired
  if (new Date() > magicLink.expiresAt) {
    await prisma.magicLink.delete({ where: { id: magicLink.id } })
    return null
  }

  // Check if already used
  if (magicLink.usedAt) {
    return null
  }

  // Mark as used
  await prisma.magicLink.update({
    where: { id: magicLink.id },
    data: { usedAt: new Date() }
  })

  // Get or create user
  let user = await prisma.user.findUnique({
    where: { email: magicLink.email }
  })

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: magicLink.email,
        // Generate a placeholder supabaseId for compatibility
        supabaseId: `magic-${randomBytes(16).toString('hex')}`,
      }
    })
  }

  return {
    email: user.email,
    userId: user.id
  }
}

// Create a session
export async function createSession(userId: string, email: string): Promise<string> {
  const payload: SessionPayload = { userId, email }
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
  
  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_EXPIRY / 1000, // Convert to seconds
    path: '/'
  })

  return token
}

// Get current session
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')

  if (!token) {
    return null
  }

  try {
    const payload = jwt.verify(token.value, JWT_SECRET) as SessionPayload
    return payload
  } catch {
    return null
  }
}

// Clear session
export async function clearSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// Cleanup expired tokens (run periodically)
export async function cleanupExpiredTokens() {
  await prisma.magicLink.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { usedAt: { not: null } }
      ]
    }
  })
}