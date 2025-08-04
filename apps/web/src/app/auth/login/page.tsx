import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const errorMessages: Record<string, string> = {
    'missing-token': 'Invalid or expired link',
    'invalid-token': 'Invalid or expired link',
    'verification-failed': 'Invalid or expired link',
  }
  
  const errorMessage = searchParams.error ? errorMessages[searchParams.error] : null
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/signup"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        {errorMessage && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{errorMessage}</p>
          </div>
        )}
        <LoginForm />
      </div>
    </div>
  )
}