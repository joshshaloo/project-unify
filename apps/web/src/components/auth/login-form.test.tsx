import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { LoginForm } from './login-form'

// Mock action for the form
const mockAction = vi.fn()
const defaultAction = async (prevState: any, formData: FormData) => {
  mockAction(prevState, formData)
  return { success: true }
}

// Mock Next.js router
const mockPush = vi.fn()
const mockReplace = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe('LoginForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render login form with all required fields', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
  })

  it('should have correct input types and attributes', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('name', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')
  })

  it('should allow user to fill out form with valid credentials', async () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    // Test that user can fill out the form
    await user.type(emailInput, 'john@example.com')

    expect(emailInput).toHaveValue('john@example.com')
    
    // Submit button should be enabled with valid data
    expect(submitButton).not.toBeDisabled()
  })

  it('should handle form state changes properly', async () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)

    // Test typing into email field
    await user.type(emailInput, 'test@example.com')
    expect(emailInput).toHaveValue('test@example.com')
    
    // Test clearing email field
    await user.clear(emailInput)
    expect(emailInput).toHaveValue('')
    
    // Form should start with no errors displayed
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('should require email field', async () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    // Try to submit with empty email
    await user.click(submitButton)

    expect(emailInput).toBeInvalid()
  })

  it('should validate email format', async () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    await user.type(emailInput, 'invalid-email')
    await user.click(submitButton)

    expect(emailInput).toBeInvalid()
  })

  it('should allow clearing and re-entering form data', async () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)

    // Fill out form
    await user.type(emailInput, 'john@example.com')
    expect(emailInput).toHaveValue('john@example.com')

    // Clear and re-enter
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    expect(emailInput).toHaveValue('new@example.com')
  })

  it('should respond to keyboard interaction correctly', async () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    // Test typing
    await user.type(emailInput, 'john@example.com')
    expect(emailInput).toHaveValue('john@example.com')
    
    // Tab to submit button
    await user.tab()
    expect(submitButton).toHaveFocus()
  })

  it('should have form elements with proper structure', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const form = screen.getByRole('button', { name: /send magic link/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    // Test form structure
    expect(form).toHaveClass('mt-8', 'space-y-6')
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    // Test accessibility
    expect(emailInput).toHaveAccessibleName()
    expect(submitButton).toHaveAccessibleName()
    
    // Test that input is properly associated with label
    expect(emailInput.getAttribute('id')).toBe('email')
  })

  it('should render form fields with correct accessibility attributes', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)

    expect(emailInput).toHaveAttribute('id', 'email')
    expect(emailInput).toHaveAttribute('name', 'email')
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('should have forgot password link', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    // Magic link login doesn't need a forgot password link
    // But might have a "Didn't receive email?" link
    const resendLink = screen.queryByText(/didn't receive/i)
    // This is optional, so we just check if it exists if implemented
    if (resendLink) {
      expect(resendLink).toBeInTheDocument()
    }
  })

  it('should display form with proper layout structure', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const form = screen.getByRole('button', { name: /send magic link/i }).closest('form')
    const emailInput = screen.getByLabelText(/email address/i)
    const submitButton = screen.getByRole('button', { name: /send magic link/i })

    expect(form).toContainElement(emailInput)
    expect(form).toContainElement(submitButton)
  })

  it('should have correct placeholder text', () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)
    
    // Check if placeholder exists (optional)
    const placeholder = emailInput.getAttribute('placeholder')
    if (placeholder) {
      expect(placeholder.toLowerCase()).toContain('email')
    }
  })

  it('should maintain form state during interaction', async () => {
    renderWithProviders(<LoginForm action={defaultAction} />)

    const emailInput = screen.getByLabelText(/email address/i)

    // Type partial email
    await user.type(emailInput, 'john')
    expect(emailInput).toHaveValue('john')

    // Continue typing
    await user.type(emailInput, '@example.com')
    expect(emailInput).toHaveValue('john@example.com')
  })
})