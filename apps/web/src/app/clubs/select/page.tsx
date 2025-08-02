'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/trpc/client'
import { RoleBadge } from '@/components/auth/role-badge'
import type { ClubWithUserData } from '@/lib/types/club'

export default function ClubSelectPage() {
  const router = useRouter()
  const { data: clubs, isLoading } = api.clubs.getMyClubs.useQuery()

  useEffect(() => {
    // If user has only one club, auto-select it
    if (clubs && clubs.length === 1) {
      document.cookie = `selectedClubId=${clubs[0].id}; path=/`
      router.push('/dashboard')
    }
  }, [clubs, router])

  const selectClub = (clubId: string) => {
    document.cookie = `selectedClubId=${clubId}; path=/`
    router.push('/dashboard')
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Loading your clubs...</p>
        </div>
      </div>
    )
  }

  if (!clubs || clubs.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Clubs Found</h2>
          <p className="text-gray-500 mb-6">
            You're not part of any clubs yet. Create your first club to get started.
          </p>
          <button
            onClick={() => router.push('/clubs/create')}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Create a Club
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Select a Club</h2>
          <p className="mt-2 text-gray-600">
            Choose which club you want to work with
          </p>
        </div>

        <div className="grid gap-4">
          {clubs.map((club: ClubWithUserData) => (
            <button
              key={club.id}
              onClick={() => selectClub(club.id)}
              className="group relative rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-all text-left"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {club.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Member since {new Date(club.joinedAt).toLocaleDateString()}
                  </p>
                </div>
                <RoleBadge role={club.role as any} />
              </div>
              <div className="absolute inset-y-0 right-0 flex items-center pr-6">
                <svg
                  className="h-5 w-5 text-gray-400 group-hover:text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="/clubs/create"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Create a new club instead
          </a>
        </div>
      </div>
    </div>
  )
}