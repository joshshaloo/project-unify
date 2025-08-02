'use client'

import { useState } from 'react'
// import { useRouter } from 'next/navigation' // Commented out as router is not currently used
import { signup } from '@/lib/auth/actions'

export function SignupForm() {
  // const router = useRouter() // Uncomment when implementing client-side navigation
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setIsLoading(true)
    
    try {
      const result = await signup(formData)
      if (result && 'error' in result) {
        setError(result.error)
        setIsLoading(false)
      }
    } catch (e) {
      // Signup successful, redirect will happen
    }
  }

  return (
    <form className="mt-8 space-y-6" action={handleSubmit}>
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {/* Safely display error by using text content only - no HTML interpretation */}
            {typeof error === 'string' ? error.replace(/<[^>]*>/g, '') : 'An error occurred'}
          </p>
        </div>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <div className="mt-1">
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="mt-1">
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Must be at least 8 characters</p>
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="agree"
          name="agree"
          type="checkbox"
          required
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="agree" className="ml-2 block text-sm text-gray-900">
          I agree to the{' '}
          <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
            Terms and Conditions
          </a>
        </label>
      </div>

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating account...' : 'Create Account'}
        </button>
      </div>
    </form>
  )
}