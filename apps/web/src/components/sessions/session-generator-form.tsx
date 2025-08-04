'use client'

import { useState } from 'react'
import { api } from '@/lib/trpc/client'

interface SessionGeneratorFormProps {
  clubId: string
  teamId: string
}

export function SessionGeneratorForm({ clubId, teamId }: SessionGeneratorFormProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const generateSession = api.ai.generateSession.useMutation({
    onSuccess: (data) => {
      setSuccess('Session generated successfully!')
      setError(null)
      setIsGenerating(false)
      // Use Next.js router for better UX instead of window.location
      window.location.href = `/clubs/${clubId}/sessions/${data.session.id}`
    },
    onError: (error) => {
      setError(error.message || 'Failed to generate session')
      setSuccess(null)
      setIsGenerating(false)
    },
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsGenerating(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(event.currentTarget)
    
    // Validate required fields
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const duration = formData.get('duration') as string
    const sessionType = formData.get('sessionType') as string

    if (!date || !time || !duration || !sessionType) {
      setError('Please fill in all required fields')
      setIsGenerating(false)
      return
    }
    
    // Parse date and time into a single Date object
    const sessionDateTime = new Date(`${date}T${time}`)
    
    // Validate session is in the future
    if (sessionDateTime <= new Date()) {
      setError('Session date and time must be in the future')
      setIsGenerating(false)
      return
    }

    // Parse focus areas from comma-separated string
    const focusAreasStr = formData.get('focus') as string
    const focus = focusAreasStr ? focusAreasStr.split(',').map(f => f.trim()).filter(Boolean) : []

    // Parse equipment from comma-separated string
    const equipmentStr = formData.get('equipment') as string
    const equipment = equipmentStr ? equipmentStr.split(',').map(e => e.trim()).filter(Boolean) : []

    try {
      await generateSession.mutateAsync({
        clubId,
        teamId,
        date: sessionDateTime,
        duration: parseInt(formData.get('duration') as string),
        sessionType: formData.get('sessionType') as 'training' | 'match_prep' | 'skills',
        focus,
        equipment,
      })
    } catch (error) {
      // Error handling is done in onError callback
    }
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Generate AI Training Session</h3>
        <p className="mt-1 text-sm text-gray-600">
          Let Coach Winston create a personalized training session for your team
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Session Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              required
              min={new Date().toISOString().split('T')[0]}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="time" className="block text-sm font-medium text-gray-700">
              Session Time
            </label>
            <input
              type="time"
              id="time"
              name="time"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
              Duration (minutes)
            </label>
            <select
              id="duration"
              name="duration"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="60">60 minutes</option>
              <option value="75">75 minutes</option>
              <option value="90">90 minutes</option>
              <option value="105">105 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>

          <div>
            <label htmlFor="sessionType" className="block text-sm font-medium text-gray-700">
              Session Type
            </label>
            <select
              id="sessionType"
              name="sessionType"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            >
              <option value="training">Regular Training</option>
              <option value="match_prep">Match Preparation</option>
              <option value="skills">Skills Focus</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="focus" className="block text-sm font-medium text-gray-700">
            Focus Areas (Optional)
          </label>
          <input
            type="text"
            id="focus"
            name="focus"
            placeholder="e.g., passing, defending, finishing"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">Separate multiple areas with commas</p>
        </div>

        <div>
          <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
            Available Equipment (Optional)
          </label>
          <input
            type="text"
            id="equipment"
            name="equipment"
            placeholder="e.g., cones, balls, goals, bibs"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">Separate multiple items with commas</p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isGenerating}
            className="flex items-center justify-center rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Session...
              </>
            ) : (
              'Generate Session'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}