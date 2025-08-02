'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'

export default function CreateClubPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const createClubMutation = api.clubs.create.useMutation({
    onSuccess: (club) => {
      // Set the new club as selected
      document.cookie = `selectedClubId=${club.id}; path=/`
      router.push('/dashboard')
    },
    onError: (error) => {
      setError(error.message)
      setIsSubmitting(false)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Club name is required')
      return
    }

    setIsSubmitting(true)
    setError('')
    createClubMutation.mutate({ name: name.trim() })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white px-8 py-10 shadow sm:rounded-lg">
          <div className="mb-8">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900">
              Create Your Club
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Get started by creating your soccer club
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Club Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="organization"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="e.g., Manchester Youth FC"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating...' : 'Create Club'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.back()}
              className="text-sm text-gray-600 hover:text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}