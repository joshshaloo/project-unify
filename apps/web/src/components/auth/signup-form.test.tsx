import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SignupForm } from './signup-form'
import * as authActions from '@/lib/auth/actions'

// Mock the auth actions
vi.mock('@/lib/auth/actions', () => ({
  signup: vi.fn(),
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

describe('SignupForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render signup form with all required fields', () => {
    renderWithProviders(<SignupForm />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/i agree to the terms and conditions/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('should have correct input types and attributes', () => {
    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    expect(nameInput).toHaveAttribute('type', 'text')
    expect(nameInput).toHaveAttribute('name', 'name')
    expect(nameInput).toHaveAttribute('required')
    expect(nameInput).toHaveAttribute('autoComplete', 'name')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('name', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')

    expect(passwordInput).toHaveAttribute('type', 'password')
    expect(passwordInput).toHaveAttribute('name', 'password')
    expect(passwordInput).toHaveAttribute('required')
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password')

    expect(agreeCheckbox).toHaveAttribute('type', 'checkbox')
    expect(agreeCheckbox).toHaveAttribute('required')
  })

  it('should display password requirements', () => {
    renderWithProviders(<SignupForm />)

    expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument()
  })

  it('should submit form with valid data', async () => {
    const mockSignup = vi.mocked(authActions.signup)
    ;(mockSignup as any).mockResolvedValue(undefined) // Successful signup

    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    
    // Use fireEvent instead of user.click to avoid requestSubmit issue
    fireEvent.submit(form)

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledTimes(1)
    })

    // Verify FormData was passed correctly
    const formData = mockSignup.mock.calls[0][0] as FormData
    expect(formData.get('name')).toBe('John Doe')
    expect(formData.get('email')).toBe('test@example.com')
    expect(formData.get('password')).toBe('password123')
    expect(formData.get('agree')).toBe('on')
  })

  it('should show loading state during form submission', async () => {
    const mockSignup = vi.mocked(authActions.signup)
    ;(mockSignup as any).mockImplementation(() => new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 1000)))

    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    
    // Use fireEvent instead of user.click to avoid requestSubmit issue
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText(/creating account/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()
    })
  })

  it('should display error message on signup failure', async () => {
    const mockSignup = vi.mocked(authActions.signup)
    ;(mockSignup as any).mockResolvedValue({ error: 'User already registered' })

    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })

    // Should not be in loading state after error
    expect(screen.getByRole('button', { name: /create account/i })).not.toBeDisabled()
  })

  it('should clear error message on new submission', async () => {
    const mockSignup = vi.mocked(authActions.signup)
    ;(mockSignup as any).mockResolvedValueOnce({ error: 'User already registered' })
    ;(mockSignup as any).mockResolvedValueOnce(undefined)

    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // First submission with error
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'existing@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('User already registered')).toBeInTheDocument()
    })

    // Clear form and try again
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.queryByText('User already registered')).not.toBeInTheDocument()
    })
  })

  it('should require all fields to be filled', async () => {
    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Try to submit with empty fields
    await user.click(submitButton)

    expect(nameInput).toBeInvalid()
    expect(emailInput).toBeInvalid()
    expect(passwordInput).toBeInvalid()
    expect(agreeCheckbox).toBeInvalid()
  })

  it('should validate email format', async () => {
    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'invalid-email')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    await user.click(submitButton)

    expect(emailInput).toBeInvalid()
  })

  it('should require terms and conditions agreement', async () => {
    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    // Don't check the agreement checkbox
    await user.click(submitButton)

    expect(agreeCheckbox).toBeInvalid()
  })

  it('should handle form submission with enter key', async () => {
    const mockSignup = vi.mocked(authActions.signup)
    ;(mockSignup as any).mockResolvedValue(undefined)

    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    await user.keyboard('{Enter}')

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle unexpected errors gracefully', async () => {
    const mockSignup = vi.mocked(authActions.signup)
    mockSignup.mockRejectedValue(new Error('Network error'))

    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    await user.click(submitButton)

    // Should not show error message for network errors (handled by redirect)
    await waitFor(() => {
      expect(screen.queryByText('Network error')).not.toBeInTheDocument()
    })
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<SignupForm />)

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')!
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    expect(form).toBeInTheDocument()
    expect(nameInput).toHaveAccessibleName()
    expect(emailInput).toHaveAccessibleName()
    expect(passwordInput).toHaveAccessibleName()
    expect(agreeCheckbox).toHaveAccessibleName()
    expect(submitButton).toHaveAccessibleName()
  })

  it('should have terms and conditions link', () => {
    renderWithProviders(<SignupForm />)

    const termsLink = screen.getByRole('link', { name: /terms and conditions/i })
    expect(termsLink).toBeInTheDocument()
    expect(termsLink).toHaveAttribute('href', '#')
  })

  it('should toggle agreement checkbox', async () => {
    renderWithProviders(<SignupForm />)

    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    expect(agreeCheckbox).not.toBeChecked()

    await user.click(agreeCheckbox)
    expect(agreeCheckbox).toBeChecked()

    await user.click(agreeCheckbox)
    expect(agreeCheckbox).not.toBeChecked()
  })

  it('should handle invitation-specific signup errors', async () => {
    const mockSignup = vi.mocked(authActions.signup)
    ;(mockSignup as any).mockResolvedValue({ error: 'Invalid invitation token' })

    renderWithProviders(<SignupForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(agreeCheckbox)
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid invitation token')).toBeInTheDocument()
    })
  })
})