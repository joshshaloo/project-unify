'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc'

export default function TestInvitationPage() {
  const [inviteUrl, setInviteUrl] = useState('')
  
  // This is a test page - in production, only authenticated users with proper roles can create invitations
  const createTestInvitation = trpc.invitation.create.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl)
    }
  })

  const handleCreateInvitation = () => {
    // This would need a real clubId and authenticated user
    alert('To test invitations, you need to:\n1. Be logged in as an admin or head coach\n2. Have a club created\n3. Use the invitation.create tRPC mutation')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Test Invitation System
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            This page demonstrates the invitation flow
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-lg font-medium">How it works:</h3>
            <ol className="mt-2 list-decimal list-inside text-sm text-gray-600 space-y-1">
              <li>Admin/Head Coach creates an invitation</li>
              <li>System generates a unique invitation link</li>
              <li>User clicks the link and sees club info</li>
              <li>User creates account and joins the club</li>
              <li>Invitation is marked as used</li>
            </ol>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-lg font-medium">Test Links:</h3>
            <div className="mt-2 space-y-2">
              <a
                href="/auth/signup"
                className="block text-blue-600 hover:text-blue-500 text-sm"
              >
                → Regular Signup (no invitation)
              </a>
              <a
                href="/auth/signup?invite=test-invalid-token"
                className="block text-blue-600 hover:text-blue-500 text-sm"
              >
                → Signup with Invalid Token
              </a>
            </div>
          </div>

          {inviteUrl && (
            <div className="border-t pt-4">
              <h3 className="text-lg font-medium">Generated Invitation:</h3>
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm break-all">
                {inviteUrl}
              </div>
            </div>
          )}

          <button
            onClick={handleCreateInvitation}
            className="w-full bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700"
          >
            Create Test Invitation
          </button>
        </div>

        <div className="text-center">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-500">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  )
}