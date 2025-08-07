import { prisma } from '@/lib/prisma'

export interface CreateInvitationParams {
  clubId: string
  email?: string
  role: 'admin' | 'head_coach' | 'assistant_coach' | 'parent'
  createdBy: string
  expiresInDays?: number
}

export async function createInvitation({
  clubId,
  email,
  role,
  createdBy,
  expiresInDays = 7
}: CreateInvitationParams) {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const invitation = await prisma.invitation.create({
    data: {
      clubId,
      email: email || '',
      role,
      createdBy,
      expiresAt,
    },
    include: {
      club: true
    }
  })

  // Generate the invitation URL
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001'
  const inviteUrl = `${baseUrl}/auth/signup?invite=${invitation.token}`

  return {
    invitation,
    inviteUrl
  }
}

export async function validateInvitation(token: string) {
  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { club: true }
  })

  if (!invitation) {
    return { valid: false, error: 'Invalid invitation token' }
  }

  if (invitation.usedAt) {
    return { valid: false, error: 'This invitation has already been used' }
  }

  if (new Date() > invitation.expiresAt) {
    return { valid: false, error: 'This invitation has expired' }
  }

  return {
    valid: true,
    invitation
  }
}

export async function getInvitationsByClub(clubId: string) {
  return prisma.invitation.findMany({
    where: { clubId },
    include: { club: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function cancelInvitation(invitationId: string) {
  return prisma.invitation.update({
    where: { id: invitationId },
    data: { expiresAt: new Date() }
  })
}