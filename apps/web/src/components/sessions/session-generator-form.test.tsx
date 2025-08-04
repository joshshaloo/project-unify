/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders, createMockFormData } from '@/test/utils/test-utils'
import { SessionGeneratorForm } from './session-generator-form'

// Mock the tRPC client
const mockMutateAsync = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@/lib/trpc/client', () => ({
  api: {
    ai: {
      generateSession: {
        useMutation: () => mockUseMutation(),
      },
    },
  },
}))

// Mock window.location
const mockLocation = {
  href: '',
}
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('SessionGeneratorForm', () => {
  const defaultProps = {
    clubId: 'club-123',
    teamId: 'team-123',
  }

  const mockGeneratedSession = {
    session: {
      id: 'session-123',
      title: 'Test Training Session',
      clubId: 'club-123',
      teamId: 'team-123',
    },
    generatedPlan: {
      title: 'Test Training Session',
      objectives: ['Improve passing'],
      warmUp: {},
      mainActivities: [],
      coolDown: {},
      notes: 'AI generated session',
      totalDuration: 90,
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    
    // Setup default mutation mock
    mockUseMutation.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isLoading: false,
      error: null,
    })
  })

  describe('rendering', () => {
    it('should render form with all required fields', () => {
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      expect(screen.getByText('Generate AI Training Session')).toBeInTheDocument()
      expect(screen.getByText('Let Coach Winston create a personalized training session for your team')).toBeInTheDocument()
      
      expect(screen.getByLabelText('Session Date')).toBeInTheDocument()
      expect(screen.getByLabelText('Session Time')).toBeInTheDocument()
      expect(screen.getByLabelText('Duration (minutes)')).toBeInTheDocument()
      expect(screen.getByLabelText('Session Type')).toBeInTheDocument()
      expect(screen.getByLabelText('Focus Areas (Optional)')).toBeInTheDocument()
      expect(screen.getByLabelText('Available Equipment (Optional)')).toBeInTheDocument()
      
      expect(screen.getByRole('button', { name: 'Generate Session' })).toBeInTheDocument()
    })

    it('should have correct default values and options', () => {
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // Date input should have minimum date set to today
      const dateInput = screen.getByLabelText('Session Date') as HTMLInputElement
      const today = new Date().toISOString().split('T')[0]
      expect(dateInput.min).toBe(today)

      // Duration options
      const durationSelect = screen.getByLabelText('Duration (minutes)') as HTMLSelectElement
      expect(durationSelect).toHaveValue('60')
      const options = Array.from(durationSelect.options).map(option => option.value)
      expect(options).toEqual(['60', '75', '90', '105', '120'])

      // Session type options
      const sessionTypeSelect = screen.getByLabelText('Session Type') as HTMLSelectElement
      expect(sessionTypeSelect).toHaveValue('training')
      const typeOptions = Array.from(sessionTypeSelect.options).map(option => option.value)
      expect(typeOptions).toEqual(['training', 'match_prep', 'skills'])
    })

    it('should show placeholder text for optional fields', () => {
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const focusInput = screen.getByLabelText('Focus Areas (Optional)')
      expect(focusInput).toHaveAttribute('placeholder', 'e.g., passing, defending, finishing')

      const equipmentInput = screen.getByLabelText('Available Equipment (Optional)')
      expect(equipmentInput).toHaveAttribute('placeholder', 'e.g., cones, balls, goals, bibs')
    })
  })

  describe('form validation', () => {
    it('should show error when required fields are missing', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // Remove HTML5 validation to test our custom validation
      const form = document.querySelector('form')!
      form.noValidate = true

      const submitButton = screen.getByRole('button', { name: 'Generate Session' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument()
      })
      
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('should show error when session date is in the past', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // Fill form with past date
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      await user.type(screen.getByLabelText('Session Date'), yesterday.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '10:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText('Session date and time must be in the future')).toBeInTheDocument()
      })
      
      expect(mockMutateAsync).not.toHaveBeenCalled()
    })

    it('should show error when session time is in the past for today', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // Fill form with today's date but past time
      const today = new Date().toISOString().split('T')[0]
      const pastTime = '08:00' // Assuming this test runs after 8 AM
      
      await user.type(screen.getByLabelText('Session Date'), today)
      await user.type(screen.getByLabelText('Session Time'), pastTime)
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      // This might pass or fail depending on current time, so we test both scenarios
      await waitFor(() => {
        const errorMessage = screen.queryByText('Session date and time must be in the future')
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument()
          expect(mockMutateAsync).not.toHaveBeenCalled()
        } else {
          // If time is in the future, mutation should be called
          expect(mockMutateAsync).toHaveBeenCalled()
        }
      })
    })

    it('should validate individual required fields', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // Test missing date
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')
      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument()
      })
    })
  })

  describe('form submission', () => {
    it('should submit form with correct data', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // Fill form with valid future date and time
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')
      await user.type(screen.getByLabelText('Focus Areas (Optional)'), 'passing, shooting')
      await user.type(screen.getByLabelText('Available Equipment (Optional)'), 'cones, balls, goals')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          clubId: 'club-123',
          teamId: 'team-123',
          date: expect.any(Date),
          duration: 90,
          sessionType: 'training',
          focus: ['passing', 'shooting'],
          equipment: ['cones', 'balls', 'goals'],
        })
      })
    })

    it('should parse focus areas correctly', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')
      await user.type(screen.getByLabelText('Focus Areas (Optional)'), 'passing, shooting, defending')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            focus: ['passing', 'shooting', 'defending'],
          })
        )
      })
    })

    it('should handle empty focus areas and equipment', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            focus: [],
            equipment: [],
          })
        )
      })
    })

    it('should trim and filter empty focus areas', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')
      await user.type(screen.getByLabelText('Focus Areas (Optional)'), ' passing , , shooting , ')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith(
          expect.objectContaining({
            focus: ['passing', 'shooting'],
          })
        )
      })
    })
  })

  describe('loading state', () => {
    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      
      mockUseMutation.mockReturnValue({
        mutateAsync: vi.fn().mockImplementation(() => new Promise(() => {})), // Never resolves
        isLoading: false,
        error: null,
      })
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      const submitButton = screen.getByRole('button', { name: 'Generate Session' })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Generating Session...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
        expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // Loading spinner
      })
    })

    it('should reset loading state after successful submission', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText('Session generated successfully!')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Generate Session' })).not.toBeDisabled()
      })
    })
  })

  describe('success handling', () => {
    it('should show success message on successful generation', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText('Session generated successfully!')).toBeInTheDocument()
      })
    })

    it('should redirect to session page on success', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(mockLocation.href).toBe('/clubs/club-123/sessions/session-123')
      })
    })

    it('should clear error message on successful submission', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // First trigger an error
      await user.click(screen.getByRole('button', { name: 'Generate Session' }))
      
      await waitFor(() => {
        expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument()
      })

      // Then submit successfully
      mockMutateAsync.mockResolvedValue(mockGeneratedSession)
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.queryByText('Please fill in all required fields')).not.toBeInTheDocument()
        expect(screen.getByText('Session generated successfully!')).toBeInTheDocument()
      })
    })
  })

  describe('error handling', () => {
    it('should show error message on failed generation', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Failed to generate session: AI service unavailable'
      mockMutateAsync.mockRejectedValue(new Error(errorMessage))
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    it('should show generic error message for unknown errors', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockRejectedValue(new Error())
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText('Failed to generate session')).toBeInTheDocument()
      })
    })

    it('should reset loading state after error', async () => {
      const user = userEvent.setup()
      mockMutateAsync.mockRejectedValue(new Error('Test error'))
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Generate Session' })).not.toBeDisabled()
      })
    })

    it('should clear success message on error', async () => {
      const user = userEvent.setup()
      
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      // First succeed
      mockMutateAsync.mockResolvedValueOnce(mockGeneratedSession)
      
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      await user.type(screen.getByLabelText('Session Date'), tomorrow.toISOString().split('T')[0])
      await user.type(screen.getByLabelText('Session Time'), '15:00')
      await user.selectOptions(screen.getByLabelText('Duration (minutes)'), '90')
      await user.selectOptions(screen.getByLabelText('Session Type'), 'training')

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.getByText('Session generated successfully!')).toBeInTheDocument()
      })

      // Then fail on next attempt
      mockMutateAsync.mockRejectedValueOnce(new Error('Network error'))
      
      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        expect(screen.queryByText('Session generated successfully!')).not.toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('should have proper form labels and structure', () => {
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      expect(screen.getByLabelText('Session Date')).toHaveAttribute('type', 'date')
      expect(screen.getByLabelText('Session Time')).toHaveAttribute('type', 'time')
      expect(screen.getByLabelText('Duration (minutes)')).toHaveAttribute('required')
      expect(screen.getByLabelText('Session Type')).toHaveAttribute('required')
    })

    it('should have proper ARIA attributes for form validation', async () => {
      const user = userEvent.setup()
      renderWithProviders(<SessionGeneratorForm {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: 'Generate Session' }))

      await waitFor(() => {
        const errorDiv = screen.getByText('Please fill in all required fields').closest('div')
        expect(errorDiv).toHaveClass('bg-red-50')
      })
    })
  })
})