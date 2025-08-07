/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'

// Force polyfill loading first
import './polyfills'

// Additional force override for JSDOM with React Server Action support
if (typeof HTMLFormElement !== 'undefined' && typeof window !== 'undefined') {
  // Override JSDOM's stubbed implementation to handle React Server Actions
  HTMLFormElement.prototype.requestSubmit = function(submitter?: HTMLElement) {
    if (submitter) {
      const form = (submitter as any).form
      if (form && form !== this) {
        throw new Error('Failed to execute \'requestSubmit\' on \'HTMLFormElement\': The specified element is not owned by this form element.')
      }
    }
    
    // Check if this form has a React Server Action
    if ((this as any).action && typeof (this as any).action === 'function') {
      // For React Server Actions, create FormData and call the action directly
      const formData = new FormData(this)
      try {
        const action = (this as any).action
        action(formData)
      } catch (error) {
        // Silently handle action errors in tests
      }
      return
    }
    
    const event = new Event('submit', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'submitter', {
      value: submitter || null,
      writable: false,
      enumerable: true,
      configurable: true
    })
    
    this.dispatchEvent(event)
  }
}

// Cleanup after each test case
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
  usePathname: () => '/test',
  redirect: vi.fn(),
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock Next.js image
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    return React.createElement('img', props)
  },
}))

// Mock Next.js headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

// Mock React DOM hooks for server actions
vi.mock('react-dom', async () => {
  const actual = await vi.importActual('react-dom')
  return {
    ...actual,
    useFormState: vi.fn((action, initialState) => {
      const [state, setState] = React.useState(initialState)
      const formAction = async (formData: FormData) => {
        const result = await action(state, formData)
        setState(result)
        return result
      }
      return [state, formAction]
    }),
    useFormStatus: vi.fn(() => ({ pending: false })),
  }
})

// Mock environment variables
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.DIRECT_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEXTAUTH_SECRET = 'test-secret'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.EMAIL_SERVER_HOST = 'localhost'
process.env.EMAIL_SERVER_PORT = '1025'
process.env.EMAIL_FROM = 'test@example.com'

// Global test configuration
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Prisma with a factory function that can be overridden
const createMockPrisma = () => ({
  user: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  invitation: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  userClub: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  club: {
    create: vi.fn(),
    findUnique: vi.fn(),
  },
  magicLink: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  $transaction: vi.fn((fn) => fn({
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    invitation: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    userClub: {
      create: vi.fn(),
    },
    club: {
      create: vi.fn(),
    },
  })),
  $queryRaw: vi.fn(),
})

vi.mock('@/lib/prisma', () => {
  const mockPrisma = createMockPrisma()
  return {
    prisma: mockPrisma,
    db: mockPrisma,
  }
})

// Mock JWT and email services
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock-jwt-token'),
    verify: vi.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
  },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}))

vi.mock('@/lib/email/send', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}))

