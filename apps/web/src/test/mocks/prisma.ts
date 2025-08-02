import { vi } from 'vitest'
import { mockDbUser, mockInvitation } from './supabase'

// Mock database records
export const mockClub = {
  id: 'club-1',
  name: 'Test FC',
  subscription: 'pro',
  settings: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  teams: [],
  _count: {
    userClubs: 5,
    teams: 2,
    sessions: 10,
  },
}

export const mockUserClub = {
  id: 'user-club-1',
  userId: 'db-user-id-123',
  clubId: 'club-1',
  role: 'head_coach',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  club: mockClub,
}

export const mockTeam = {
  id: 'team-1',
  name: 'U18 Team',
  clubId: 'club-1',
  ageGroup: 'U18',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Create mock Prisma client
export const createMockPrismaClient = (overrides = {}) => {
  const defaultMock = {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    club: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    userClub: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    session: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $executeRaw: vi.fn(),
    $queryRaw: vi.fn(),
  }

  return { ...defaultMock, ...overrides }
}

// Success scenarios
export const mockSuccessfulUserLookup = () => {
  mockPrisma.user.findUnique.mockResolvedValue(mockDbUser)
  return mockPrisma
}

export const mockSuccessfulUserCreation = () => {
  mockPrisma.user.create.mockResolvedValue(mockDbUser)
  mockPrisma.userClub.create.mockResolvedValue(mockUserClub)
  mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation)
  mockPrisma.invitation.update.mockResolvedValue({
    ...mockInvitation,
    usedAt: new Date(),
    usedByEmail: 'test@example.com',
  })
  mockPrisma.$transaction.mockImplementation(async (callback) => {
    return callback(mockPrisma)
  })
  return mockPrisma
}

export const mockValidInvitation = () => {
  mockPrisma.invitation.findUnique.mockResolvedValue(mockInvitation)
  return mockPrisma
}

export const mockUsedInvitation = () => {
  mockPrisma.invitation.findUnique.mockResolvedValue({
    ...mockInvitation,
    usedAt: new Date('2024-01-01'),
  })
  return mockPrisma
}

export const mockExpiredInvitation = () => {
  mockPrisma.invitation.findUnique.mockResolvedValue({
    ...mockInvitation,
    expiresAt: new Date('2023-01-01'), // Past date
  })
  return mockPrisma
}

export const mockInvalidInvitation = () => {
  mockPrisma.invitation.findUnique.mockResolvedValue(null)
  return mockPrisma
}

export const mockNoUser = () => {
  mockPrisma.user.findUnique.mockResolvedValue(null)
  return mockPrisma
}

export const mockDatabaseError = () => {
  mockPrisma.user.create.mockRejectedValue(new Error('Database connection failed'))
  mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'))
  return mockPrisma
}

// Mock the Prisma client
export const mockPrisma = createMockPrismaClient()

vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))