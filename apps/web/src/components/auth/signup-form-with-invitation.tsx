'use client'

import { useFormState, useFormStatus } from 'react-dom'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating account...' : 'Create Account'}
    </button>
  )
}

interface SignupFormWithInvitationProps {
  inviteToken?: string
  invitationData?: {
    email: string
    club: { name: string }
    role: string
  } | null
  action: (prevState: any, formData: FormData) => Promise<any>
}

export function SignupFormWithInvitation({ inviteToken, invitationData, action }: SignupFormWithInvitationProps) {
  const [state, formAction] = useFormState(action, null)

  return (
    <form className="mt-8 space-y-6" action={formAction}>
      {inviteToken && (
        <input type="hidden" name="invite" value={inviteToken} />
      )}
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {/* Safely display error by using text content only - no HTML interpretation */}
            {typeof state.error === 'string' ? state.error.replace(/<[^>]*>/g, '') : 'An error occurred'}
          </p>
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-800">
            {state.message || 'Check your email for a magic link to sign in!'}
          </p>
        </div>
      )}
      <div className="space-y-4 rounded-md shadow-sm">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="mt-1 relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="John Doe"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            defaultValue={invitationData?.email || ''}
            readOnly={!!invitationData?.email}
            className="mt-1 relative block w-full rounded-md border-0 px-3 py-2 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 read-only:bg-gray-50"
            placeholder="john@example.com"
          />
        </div>
      </div>

      <div className="flex items-center">
        <input
          id="agree-terms"
          name="agree-terms"
          type="checkbox"
          required
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
        />
        <label htmlFor="agree-terms" className="ml-2 block text-sm text-gray-900">
          I agree to the{' '}
          <a href="#" className="text-blue-600 hover:text-blue-500">
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