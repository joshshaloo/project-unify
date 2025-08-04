import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/utils/test-utils'
import { SignupForm } from './signup-form'

// Mock action for the form
const mockAction = vi.fn()
const defaultAction = async (prevState: any, formData: FormData) => {
  mockAction(prevState, formData)
  return { success: true, message: 'Check your email to complete registration!' }
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

describe('SignupForm', () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render signup form with all required fields', () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/i agree to the terms and conditions/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  it('should have correct input types and attributes', () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    expect(nameInput).toHaveAttribute('type', 'text')
    expect(nameInput).toHaveAttribute('name', 'name')
    expect(nameInput).toHaveAttribute('required')
    expect(nameInput).toHaveAttribute('autoComplete', 'name')

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('name', 'email')
    expect(emailInput).toHaveAttribute('required')
    expect(emailInput).toHaveAttribute('autoComplete', 'email')

    expect(agreeCheckbox).toHaveAttribute('type', 'checkbox')
    expect(agreeCheckbox).toHaveAttribute('required')
  })

  it('should allow user to fill out form with valid data', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Test that user can fill out the form
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.click(agreeCheckbox)

    expect(nameInput).toHaveValue('John Doe')
    expect(emailInput).toHaveValue('john@example.com')
    expect(agreeCheckbox).toBeChecked()
    
    // Submit button should be enabled with valid data
    expect(submitButton).not.toBeDisabled()
  })

  it('should handle component state changes properly', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    // Initially, the checkbox should not be checked
    expect(agreeCheckbox).not.toBeChecked()
    
    // Check the checkbox
    await user.click(agreeCheckbox)
    expect(agreeCheckbox).toBeChecked()
    
    // Uncheck the checkbox
    await user.click(agreeCheckbox)
    expect(agreeCheckbox).not.toBeChecked()
    
    // Form should start with no errors displayed
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  })

  it('should render form fields with correct accessibility attributes', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Test accessibility attributes
    expect(nameInput).toHaveAccessibleName()
    expect(emailInput).toHaveAccessibleName()
    expect(agreeCheckbox).toHaveAccessibleName()
    expect(submitButton).toHaveAccessibleName()
    
    // Test that inputs are properly associated with labels
    expect(nameInput.getAttribute('id')).toBe('name')
    expect(emailInput.getAttribute('id')).toBe('email')
    expect(agreeCheckbox.getAttribute('id')).toBe('agree')
  })

  it('should allow clearing and re-entering form data', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    // Fill out form
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.click(agreeCheckbox)

    // Clear and re-enter email
    await user.clear(emailInput)
    await user.type(emailInput, 'new@example.com')

    expect(emailInput).toHaveValue('new@example.com')
    // Other fields should remain unchanged
    expect(nameInput).toHaveValue('John Doe')
    expect(agreeCheckbox).toBeChecked()
  })

  it('should require all fields to be filled', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Try to submit with empty fields using fireEvent.click for validation
    await user.click(submitButton)

    expect(nameInput).toBeInvalid()
    expect(emailInput).toBeInvalid()
    expect(agreeCheckbox).toBeInvalid()
  })

  it('should validate email format', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'invalid-email')
    await user.click(agreeCheckbox)
    await user.click(submitButton)

    expect(emailInput).toBeInvalid()
  })

  it('should require terms and conditions agreement', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    // Don't check the agreement checkbox
    await user.click(submitButton)

    expect(agreeCheckbox).toBeInvalid()
  })

  it('should respond to keyboard interaction correctly', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    // Test keyboard navigation and input
    await user.type(nameInput, 'John Doe')
    expect(nameInput).toHaveValue('John Doe')
    
    // Tab to email field
    await user.tab()
    expect(emailInput).toHaveFocus()
    await user.type(emailInput, 'john@example.com')
    
    // Focus the checkbox directly and test interaction
    await user.click(agreeCheckbox)
    expect(agreeCheckbox).toBeChecked()
    
    // Test unchecking with keyboard
    await user.keyboard(' ')
    expect(agreeCheckbox).not.toBeChecked()
  })

  it('should have form elements with proper structure', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const form = screen.getByRole('button', { name: /create account/i }).closest('form')
    expect(form).toBeInTheDocument()
    
    // Test form structure
    expect(form).toHaveClass('mt-8', 'space-y-6')
    
    // Test that all required form elements are present
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })
    
    expect(nameInput).toBeInTheDocument()
    expect(emailInput).toBeInTheDocument()
    expect(agreeCheckbox).toBeInTheDocument()
    expect(submitButton).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    screen.getByRole('button', { name: /create account/i }).closest('form')!
    const nameInput = screen.getByLabelText(/full name/i)
    const emailInput = screen.getByLabelText(/email address/i)
    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)
    const submitButton = screen.getByRole('button', { name: /create account/i })

    // Test accessibility
    expect(nameInput).toHaveAccessibleName()
    expect(emailInput).toHaveAccessibleName()
    expect(agreeCheckbox).toHaveAccessibleName()
    expect(submitButton).toHaveAccessibleName()
  })

  it('should have terms and conditions link', () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const termsLink = screen.getByRole('link', { name: /terms and conditions/i })
    expect(termsLink).toBeInTheDocument()
    expect(termsLink).toHaveAttribute('href', '#')
  })

  it('should toggle agreement checkbox', async () => {
    renderWithProviders(<SignupForm action={defaultAction} />)

    const agreeCheckbox = screen.getByLabelText(/i agree to the terms and conditions/i)

    expect(agreeCheckbox).not.toBeChecked()

    await user.click(agreeCheckbox)
    expect(agreeCheckbox).toBeChecked()

    await user.click(agreeCheckbox)
    expect(agreeCheckbox).not.toBeChecked()
  })
})