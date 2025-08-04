'use client'

import { useFormState, useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating account...' : 'Create Account'}
    </button>
  )
}

interface SignupFormProps {
  action: (prevState: any, formData: FormData) => Promise<any>
}

export function SignupForm({ action }: SignupFormProps) {
  const [state, formAction] = useFormState(action, null)

  return (
    <form className="mt-8 space-y-6" action={formAction}>
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {/* Safely display error by using text content only - no HTML interpretation */}
            {typeof state.error === 'string' ? state.error.replace(/<[^>]*>/g, '') : 'An error occurred'}
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
          <label htmlFor="clubName" className="block text-sm font-medium text-gray-700">
            Club Name (Optional)
          </label>
          <div className="mt-1">
            <input
              id="clubName"
              name="clubName"
              type="text"
              autoComplete="organization"
              className="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
              placeholder="Enter your club name to create a new club"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">Leave blank if joining an existing club</p>
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
        <SubmitButton />
      </div>
    </form>
  )
}