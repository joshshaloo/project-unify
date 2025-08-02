import { getUser, signOut } from '@/lib/auth/actions'
import { redirect } from 'next/navigation'
import { RoleBadge } from '@/components/auth/role-badge'
import { api } from '@/lib/trpc/server-api'
import type { ClubWithUserData } from '@/lib/types/club'

export default async function DashboardPage() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's clubs using tRPC
  const clubs = await api.clubs.getMyClubs()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-semibold">Project Unify</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {user.email}
              </span>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome back, {user.name || 'Coach'}!
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {user.onboardingCompleted 
              ? "Here's your dashboard overview"
              : "Complete your profile to get started"
            }
          </p>
        </div>

        {/* User's clubs */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Your Clubs</h3>
          {clubs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500">
                You're not part of any clubs yet. Join or create a club to get started.
              </p>
              <button className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500">
                Create a Club
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {clubs.map((club: ClubWithUserData) => (
                <div
                  key={club.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-gray-900">
                      {club.name}
                    </h4>
                    <RoleBadge role={club.role as any} />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Joined: {new Date(club.joinedAt).toLocaleDateString()}
                  </p>
                  <div className="mt-4">
                    <a
                      href={`/clubs/${club.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View club →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Clubs</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {clubs.length}
            </p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Active Teams</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <p className="text-sm font-medium text-gray-600">Total Players</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">0</p>
          </div>
        </div>
      </main>
    </div>
  )
}