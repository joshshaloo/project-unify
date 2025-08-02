/* eslint-disable @typescript-eslint/no-explicit-any */
// Test data factories for creating consistent test data
import { faker } from '@faker-js/faker'

export interface TestUser {
  id: string
  email: string
  name: string
  supabaseId: string
  onboardingCompleted: boolean
  createdAt: Date
  updatedAt: Date
}

export interface TestClub {
  id: string
  name: string
  subscription: 'trial' | 'basic' | 'pro' | 'enterprise'
  settings: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface TestInvitation {
  id: string
  token: string
  email: string | null
  role: 'head_coach' | 'assistant_coach' | 'parent' | 'admin'
  clubId: string
  expiresAt: Date
  usedAt: Date | null
  usedByEmail: string | null
}

export interface TestUserClub {
  id: string
  userId: string
  clubId: string
  role: 'head_coach' | 'assistant_coach' | 'parent' | 'admin'
  status: 'active' | 'inactive' | 'pending'
  createdAt: Date
  updatedAt: Date
}

// User factory
export const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  supabaseId: faker.string.uuid(),
  onboardingCompleted: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
})

// Club factory
export const createTestClub = (overrides: Partial<TestClub> = {}): TestClub => ({
  id: faker.string.uuid(),
  name: `${faker.word.adjective()} ${faker.word.noun()} FC`,
  subscription: faker.helpers.arrayElement(['trial', 'basic', 'pro', 'enterprise']),
  settings: {},
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
})

// Invitation factory
export const createTestInvitation = (overrides: Partial<TestInvitation> = {}): TestInvitation => ({
  id: faker.string.uuid(),
  token: faker.string.alphanumeric(32),
  email: faker.datatype.boolean() ? faker.internet.email() : null,
  role: faker.helpers.arrayElement(['head_coach', 'assistant_coach', 'parent', 'admin']),
  clubId: faker.string.uuid(),
  expiresAt: faker.date.future(),
  usedAt: null,
  usedByEmail: null,
  ...overrides,
})

// UserClub factory
export const createTestUserClub = (overrides: Partial<TestUserClub> = {}): TestUserClub => ({
  id: faker.string.uuid(),
  userId: faker.string.uuid(),
  clubId: faker.string.uuid(),
  role: faker.helpers.arrayElement(['head_coach', 'assistant_coach', 'parent', 'admin']),
  status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
})

// Create a user with club association
export const createTestUserWithClub = (
  userOverrides: Partial<TestUser> = {},
  clubOverrides: Partial<TestClub> = {}
) => {
  const user = createTestUser(userOverrides)
  const club = createTestClub(clubOverrides)
  const userClub = createTestUserClub({
    userId: user.id,
    clubId: club.id,
  })

  return {
    user,
    club,
    userClub,
    fullUser: {
      ...user,
      clubs: [
        {
          ...userClub,
          club,
        },
      ],
    },
  }
}

// Create expired invitation
export const createExpiredInvitation = (overrides: Partial<TestInvitation> = {}): TestInvitation =>
  createTestInvitation({
    expiresAt: faker.date.past(),
    ...overrides,
  })

// Create used invitation
export const createUsedInvitation = (overrides: Partial<TestInvitation> = {}): TestInvitation =>
  createTestInvitation({
    usedAt: faker.date.past(),
    usedByEmail: faker.internet.email(),
    ...overrides,
  })

// Create valid invitation
export const createValidInvitation = (overrides: Partial<TestInvitation> = {}): TestInvitation =>
  createTestInvitation({
    expiresAt: faker.date.future(),
    usedAt: null,
    usedByEmail: null,
    ...overrides,
  })

// Batch creation helpers
export const createTestUsers = (count: number, overrides: Partial<TestUser>[] = []): TestUser[] =>
  Array.from({ length: count }, (_, index) => 
    createTestUser(overrides[index] || {})
  )

export const createTestClubs = (count: number, overrides: Partial<TestClub>[] = []): TestClub[] =>
  Array.from({ length: count }, (_, index) => 
    createTestClub(overrides[index] || {})
  )