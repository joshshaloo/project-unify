import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            There was a problem signing you in. This could be because:
          </p>
        </div>
        <div className="mt-8 text-left">
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>The email confirmation link has expired</li>
            <li>You've already used this confirmation link</li>
            <li>There was a network error</li>
          </ul>
        </div>
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 text-center"
          >
            Try Signing In
          </Link>
          <Link
            href="/auth/signup"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 text-center"
          >
            Create New Account
          </Link>
        </div>
      </div>
    </div>
  )
}