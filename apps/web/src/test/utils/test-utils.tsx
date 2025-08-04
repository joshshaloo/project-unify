import React, { type ReactElement } from 'react'  
import { render, type RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, expect } from 'vitest'

// Create a new QueryClient for each test
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// Mock form data utility
export const createMockFormData = (data: Record<string, string | undefined>) => {
  const formData = new FormData()
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value)
    }
  })
  return formData
}

// Create mock event
export const createMockEvent = (overrides: Partial<Event> = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: {},
  currentTarget: {},
  ...overrides,
})

// Wait for async operations
export const waitForPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock server action result
export const mockActionResult = <T,>(result: T) => Promise.resolve(result)

// Create mock router
export const createMockRouter = (overrides = {}) => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  ...overrides,
})

// Mock TRPC context
export const createMockTRPCContext = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    supabaseId: 'test-supabase-id',
    onboardingCompleted: true,
  },
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    club: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    userClub: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    session: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  ...overrides,
})

// Mock file for upload tests
export const createMockFile = (
  name = 'test.jpg',
  type = 'image/jpeg',
  size = 1024
) => {
  const file = new File(['test content'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

// Custom matchers for better test assertions
export const expectToBeCalledWithFormData = (
  mockFn: ReturnType<typeof vi.fn>,
  expectedData: Record<string, string>
) => {
  expect(mockFn).toHaveBeenCalled()
  const formData = mockFn.mock.calls[0][0] as FormData
  Object.entries(expectedData).forEach(([key, value]) => {
    expect(formData.get(key)).toBe(value)
  })
}

// Mock localStorage
export const mockLocalStorage = () => {
  const storage: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => storage[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      storage[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
    key: vi.fn((index: number) => Object.keys(storage)[index] || null),
    get length() {
      return Object.keys(storage).length
    },
  }
}

// Mock sessionStorage (same implementation as localStorage)
export const mockSessionStorage = mockLocalStorage

// Re-export everything from React Testing Library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'