import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
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

  it('should allow user to fill out form with valid credentials', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')

    // Verify form is filled correctly
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
    
    // Submit button should be enabled with valid data
    expect(submitButton).not.toBeDisabled()
  })

  it('should handle form state changes properly', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const rememberCheckbox = screen.getByLabelText(/remember me/i)

    // Form should start with no errors displayed
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
    
    // Initially, the remember me checkbox should not be checked
    expect(rememberCheckbox).not.toBeChecked()
    
    // User can toggle the checkbox
    await user.click(rememberCheckbox)
    expect(rememberCheckbox).toBeChecked()
    
    await user.click(rememberCheckbox)
    expect(rememberCheckbox).not.toBeChecked()
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

  it('should allow clearing and re-entering form data', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Fill out form
    await user.type(emailInput, 'original@example.com')
    await user.type(passwordInput, 'originalpassword')

    // Verify initial values
    expect(emailInput).toHaveValue('original@example.com')
    expect(passwordInput).toHaveValue('originalpassword')

    // Clear and re-enter email
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')
    
    expect(emailInput).toHaveValue('new@example.com')
    // Password should remain unchanged
    expect(passwordInput).toHaveValue('originalpassword')
  })

  it('should respond to keyboard interaction correctly', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const rememberCheckbox = screen.getByLabelText(/remember me/i)

    // Test keyboard navigation and input
    await user.type(emailInput, 'test@example.com')
    await user.tab()
    expect(passwordInput).toHaveFocus()
    
    await user.type(passwordInput, 'password123')
    await user.tab()
    expect(rememberCheckbox).toHaveFocus()
    
    // Test space key for checkbox
    await user.keyboard(' ')
    expect(rememberCheckbox).toBeChecked()
  })

  it('should have form elements with proper structure', async () => {
    renderWithProviders(<LoginForm />)

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    // Test form structure
    expect(form).toHaveClass('mt-8', 'space-y-6')
    
    // Test that all required form elements are present
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const rememberCheckbox = screen.getByLabelText(/remember me/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    const forgotLink = screen.getByText(/forgot your password/i)
    
    expect(emailInput).toBeInTheDocument()
    expect(passwordInput).toBeInTheDocument()
    expect(rememberCheckbox).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
    expect(forgotLink).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<LoginForm />)

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!
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

  it('should render form fields with correct accessibility attributes', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const rememberCheckbox = screen.getByLabelText(/remember me/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    // Test accessibility attributes
    expect(emailInput).toHaveAccessibleName()
    expect(passwordInput).toHaveAccessibleName()
    expect(rememberCheckbox).toHaveAccessibleName()
    expect(submitButton).toHaveAccessibleName()
    
    // Test that inputs are properly associated with labels
    expect(emailInput.getAttribute('id')).toBe('email')
    expect(passwordInput.getAttribute('id')).toBe('password')
    expect(rememberCheckbox.getAttribute('id')).toBe('remember-me')
  })

  it('should have forgot password link', () => {
    renderWithProviders(<LoginForm />)

    const forgotLink = screen.getByRole('link', { name: /forgot your password/i })
    expect(forgotLink).toBeInTheDocument()
    expect(forgotLink).toHaveAttribute('href', '#')
  })

  it('should display form with proper layout structure', () => {
    renderWithProviders(<LoginForm />)

    // Check for proper form sections
    const emailSection = screen.getByLabelText(/email address/i).closest('div')
    const passwordSection = screen.getByLabelText(/password/i).closest('div')
    const optionsSection = screen.getByText(/remember me/i).closest('div')
    const submitSection = screen.getByRole('button', { name: /sign in/i }).closest('div')

    expect(emailSection).toBeInTheDocument()
    expect(passwordSection).toBeInTheDocument()
    expect(optionsSection).toBeInTheDocument()
    expect(submitSection).toBeInTheDocument()
  })

  it('should have correct placeholder text', () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)

    expect(emailInput).toHaveAttribute('placeholder', 'Email address')
    expect(passwordInput).toHaveAttribute('placeholder', 'Password')
  })

  it('should maintain form state during interaction', async () => {
    renderWithProviders(<LoginForm />)

    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const rememberCheckbox = screen.getByLabelText(/remember me/i)

    // Fill form with data
    await user.type(emailInput, 'user@example.com')
    await user.type(passwordInput, 'securepassword')
    await user.click(rememberCheckbox)

    // Verify all state is maintained
    expect(emailInput).toHaveValue('user@example.com')
    expect(passwordInput).toHaveValue('securepassword')
    expect(rememberCheckbox).toBeChecked()

    // Focus on different elements and verify state persists
    await user.click(emailInput)
    await user.click(passwordInput)
    await user.click(rememberCheckbox) // This should uncheck it

    expect(emailInput).toHaveValue('user@example.com')
    expect(passwordInput).toHaveValue('securepassword')
    expect(rememberCheckbox).not.toBeChecked()
  })
})