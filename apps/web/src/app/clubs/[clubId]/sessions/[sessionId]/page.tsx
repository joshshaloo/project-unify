import { getSession } from '@/lib/auth/magic-link'
import { redirect } from 'next/navigation'
import { api } from '@/lib/trpc/server-api'
import { SessionViewer } from '@/components/sessions/session-viewer'

interface SessionPageProps {
  params: {
    clubId: string
    sessionId: string
  }
}

export default async function SessionPage({ params }: SessionPageProps) {
  const session = await getSession()
  
  if (!session) {
    redirect('/auth/login')
  }

  try {
    const sessionData = await api.sessions.getById({ id: params.sessionId })
    
    if (!sessionData || sessionData.clubId !== params.clubId) {
      redirect('/dashboard')
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold">Training Session</h1>
              </div>
              <div className="flex items-center">
                <a
                  href={`/clubs/${params.clubId}/teams/${sessionData.teamId}/sessions`}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back to Sessions
                </a>
              </div>
            </div>
          </div>
        </nav>

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <SessionViewer session={sessionData} />
        </main>
      </div>
    )
  } catch (error) {
    console.error('Error loading session:', error)
    redirect('/dashboard')
  }
}