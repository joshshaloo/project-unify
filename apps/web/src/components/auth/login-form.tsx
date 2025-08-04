'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { signIn } from '@/app/auth/login/actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex w-full justify-center rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Sending magic link...' : 'Send Magic Link'}
    </button>
  )
}

interface LoginFormProps {
  action?: typeof signIn
}

export function LoginForm({ action = signIn }: LoginFormProps = {}) {
  const [state, formAction] = useFormState(action, null)

  return (
    <form className="mt-8 space-y-6" action={formAction}>
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Enter your email to receive a magic link
        </p>
      </div>
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
      <div className="-space-y-px rounded-md shadow-sm">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="relative block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            placeholder="Email address"
          />
        </div>
      </div>


      <div>
        <SubmitButton />
      </div>
    </form>
  )
}