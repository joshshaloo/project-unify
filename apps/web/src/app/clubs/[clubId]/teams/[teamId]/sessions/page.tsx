import { getSession } from '@/lib/auth/magic-link'
import { redirect } from 'next/navigation'
import { api } from '@/lib/trpc/server-api'
import { SessionGeneratorForm } from '@/components/sessions/session-generator-form'

interface SessionsPageProps {
  params: {
    clubId: string
    teamId: string
  }
}

export default async function SessionsPage({ params }: SessionsPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  try {
    // Get team details (this will also verify access)
    const team = await api.teams.getById({ id: params.teamId })
    
    if (!team || team.clubId !== params.clubId) {
      redirect('/dashboard')
    }

    // Get existing sessions for this team
    const sessions = await api.sessions.getByTeam({ teamId: params.teamId })

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">
                  {team.name} - Training Sessions
                </h1>
              </div>
              <div className="flex items-center">
                <a
                  href={`/clubs/${params.clubId}`}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Club
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Training Sessions</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage and create training sessions for {team.name}
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Session Generator */}
            <div className="lg:col-span-2">
              <SessionGeneratorForm clubId={params.clubId} teamId={params.teamId} />
            </div>

            {/* Recent Sessions Sidebar */}
            <div>
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
                
                {sessions.length === 0 ? (
                  <p className="text-sm text-gray-500">No sessions yet. Generate your first one!</p>
                ) : (
                  <div className="space-y-3">
                    {sessions.slice(0, 5).map((session) => (
                      <a
                        key={session.id}
                        href={`/clubs/${params.clubId}/sessions/${session.id}`}
                        className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {session.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(session.date).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === 'draft' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : session.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        {session.aiGenerated && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              🤖 AI Generated
                            </span>
                          </div>
                        )}
                      </a>
                    ))}
                  </div>
                )}

                {sessions.length > 5 && (
                  <div className="mt-4">
                    <a
                      href={`/clubs/${params.clubId}/teams/${params.teamId}/sessions/all`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View all sessions →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading sessions page:', error)
    redirect('/dashboard')
  }
}