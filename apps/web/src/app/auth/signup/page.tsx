import { validateInvitation } from '@/lib/auth/invitations'
import Link from 'next/link'
import { SignupFormWithInvitation } from '@/components/auth/signup-form-with-invitation'

interface SignupPageProps {
  searchParams: {
    invite?: string
  }
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  let invitationData = null
  let invitationError = null

  if (searchParams.invite) {
    const result = await validateInvitation(searchParams.invite)
    if (result.valid) {
      invitationData = result.invitation
    } else {
      invitationError = result.error
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Create your account
          </h2>
          {invitationData && (
            <div className="mt-4 rounded-md bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                You've been invited to join <strong>{invitationData.club.name}</strong> as a{' '}
                <strong>{invitationData.role.replace('_', ' ')}</strong>
              </p>
            </div>
          )}
          {invitationError && (
            <div className="mt-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{invitationError}</p>
            </div>
          )}
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              href="/auth/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        <SignupFormWithInvitation 
          inviteToken={searchParams.invite} 
          invitationData={invitationData}
        />
      </div>
    </div>
  )
}