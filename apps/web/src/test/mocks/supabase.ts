import { vi } from 'vitest'

// Mock user data
export const mockUser = {
  id: 'test-user-id-123',
  email: 'test@example.com',
  user_metadata: {
    name: 'Test User',
  },
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  aud: 'authenticated',
  role: 'authenticated',
}

export const mockDbUser = {
  id: 'db-user-id-123',
  email: 'test@example.com',
  name: 'Test User',
  supabaseId: 'test-user-id-123',
  onboardingCompleted: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  clubs: [
    {
      id: 'user-club-1',
      role: 'head_coach',
      status: 'active',
      club: {
        id: 'club-1',
        name: 'Test FC',
        subscription: 'pro',
        settings: {},
      },
    },
  ],
}

export const mockInvitation = {
  id: 'invite-123',
  token: 'valid-token-123',
  email: 'test@example.com',
  role: 'assistant_coach',
  clubId: 'club-1',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  usedAt: null,
  usedByEmail: null,
  club: {
    id: 'club-1',
    name: 'Test FC',
  },
}

// Mock Supabase client methods
export const createMockSupabaseClient = (overrides = {}) => {
  const defaultMock = {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      like: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      contains: vi.fn().mockReturnThis(),
      containedBy: vi.fn().mockReturnThis(),
      rangeGt: vi.fn().mockReturnThis(),
      rangeLt: vi.fn().mockReturnThis(),
      rangeGte: vi.fn().mockReturnThis(),
      rangeLte: vi.fn().mockReturnThis(),
      rangeAdjacent: vi.fn().mockReturnThis(),
      overlaps: vi.fn().mockReturnThis(),
      textSearch: vi.fn().mockReturnThis(),
      match: vi.fn().mockReturnThis(),
      not: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      filter: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      single: vi.fn(),
      maybeSingle: vi.fn(),
    })),
    rpc: vi.fn(),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        download: vi.fn(),
        remove: vi.fn(),
        list: vi.fn(),
        getPublicUrl: vi.fn(),
        createSignedUrl: vi.fn(),
        createSignedUrls: vi.fn(),
      })),
    },
  }

  return { ...defaultMock, ...overrides }
}

// Success scenarios
export const mockSuccessfulLogin = () => {
  return createMockSupabaseClient({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'mock-token' } },
        error: null,
      }),
      getUser: vi.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  })
}

export const mockSuccessfulSignup = () => {
  return createMockSupabaseClient({
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { 
          user: mockUser, 
          session: null // Email confirmation required
        },
        error: null,
      }),
    },
  })
}

// Error scenarios
export const mockFailedLogin = (errorMessage = 'Invalid login credentials') => {
  return createMockSupabaseClient({
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: errorMessage },
      }),
    },
  })
}

export const mockFailedSignup = (errorMessage = 'User already registered') => {
  return createMockSupabaseClient({
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: { message: errorMessage },
      }),
    },
  })
}

export const mockNoUser = () => {
  return createMockSupabaseClient({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  })
}

// Export a mock createClient function that can be imported and used in tests
export const mockCreateClient = vi.fn()

// Default mock implementation - will be overridden in tests
mockCreateClient.mockResolvedValue(createMockSupabaseClient())