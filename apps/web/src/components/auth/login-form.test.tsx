import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { LoginForm } from './login-form'
import * as authActions from '@/lib/auth/actions'

// Mock the auth actions
vi.mock('@/lib/auth/actions', () => ({
  login: vi.fn(),
}))

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
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByText(/remember me/i)).toBeInTheDocument()
    expect(screen.getByText(/forgot your password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should have correct input types and attributes', () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('name', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('name', 'password')
    expect(passwordInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('autoComplete', 'current-password')
  })

  it('should submit form with valid credentials', async () => {
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockResolvedValue(undefined) // Successful login

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1)
    })

    // Verify FormData was passed correctly
    const formData = mockLogin.mock.calls[0][0] as FormData
    expect(formData.get('email')).toBe('test@example.com')
    expect(formData.get('password')).toBe('password123')
  })

  it('should show loading state during form submission', async () => {
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)))

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/signing in/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  it('should display error message on login failure', async () => {
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockResolvedValue({ error: 'Invalid login credentials' })

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })

    // Should not be in loading state after error
    expect(screen.getByRole('button', { name: /sign in/i })).not.toBeDisabled()
  })

  it('should clear error message on new submission', async () => {
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockResolvedValueOnce({ error: 'Invalid login credentials' })
    mockLogin.mockResolvedValueOnce(undefined)

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // First submission with error
    await user.type(emailInput, 'wrong@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })

    // Clear form and try again
    await user.clear(emailInput)
    await user.clear(passwordInput)
    await user.type(emailInput, 'correct@example.com')
    await user.type(passwordInput, 'correctpassword')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('Invalid login credentials')).not.toBeInTheDocument()
    })
  })

  it('should handle form submission with enter key', async () => {
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockResolvedValue(undefined)

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle unexpected errors gracefully', async () => {
    const mockLogin = vi.mocked(authActions.login)
    mockLogin.mockRejectedValue(new Error('Network error'))

    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Should not show error message for network errors (handled by redirect)
    await waitFor(() => {
      expect(screen.queryByText('Network error')).not.toBeInTheDocument()
    })
  })

  it('should validate email format', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Browser validation should prevent submission
    expect(emailInput).toBeInvalid()
  })

  it('should require both email and password', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Try to submit with empty fields
    await user.click(submitButton)

    expect(emailInput).toBeInvalid()
    expect(passwordInput).toBeInvalid()
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<LoginForm />)

    const form = screen.getByRole('form', { hidden: true })
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    expect(form).toBeInTheDocument()
    expect(emailInput).toHaveAccessibleName()
    expect(passwordInput).toHaveAccessibleName()
    expect(submitButton).toHaveAccessibleName()
  })

  it('should toggle remember me checkbox', async () => {
    renderWithProviders(<LoginForm />)

    const rememberCheckbox = screen.getByLabelText(/remember me/i)

    expect(rememberCheckbox).not.toBeChecked()

    await user.click(rememberCheckbox)
    expect(rememberCheckbox).toBeChecked()

    await user.click(rememberCheckbox)
    expect(rememberCheckbox).not.toBeChecked()
  })
})