'use client'

import { useState } from 'react'

interface SessionViewerProps {
  session: any // TODO: Create proper TypeScript types
}

export function SessionViewer({ session }: SessionViewerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'edit'>('overview')

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (date: string | Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      draft: 'bg-yellow-100 text-yellow-800',
      planned: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'plan', name: 'Session Plan' },
    { id: 'edit', name: 'Edit' },
  ]

  return (
    <div className="space-y-6">
      {/* Session Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{session.title}</h1>
            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
              <span>{formatDate(session.date)}</span>
              <span>•</span>
              <span>{formatTime(session.date)}</span>
              <span>•</span>
              <span>{session.duration} minutes</span>
              <span>•</span>
              <span>{session.team.name}</span>
            </div>
            <div className="mt-2 flex items-center space-x-2">
              {getStatusBadge(session.status)}
              {session.aiGenerated && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  🤖 AI Generated
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Export PDF
            </button>
            <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Session Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Session Details</h3>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{session.type}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Duration</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.duration} minutes</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.location || 'Not specified'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Weather</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.weatherConditions || 'Not specified'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Created by</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {session.createdBy.name || session.createdBy.email}
                  </dd>
                </div>
              </dl>
            </div>

            {session.notes && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Coach Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.notes}</p>
              </div>
            )}
          </div>

          {/* Team Info Sidebar */}
          <div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Team Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Team</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.team.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Age Group</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.team.ageGroup}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Skill Level</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{session.team.skillLevel}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Players</dt>
                  <dd className="mt-1 text-sm text-gray-900">{session.team.players?.length || 0}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'plan' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Training Plan</h3>
          
          {session.plan && typeof session.plan === 'object' ? (
            <div className="space-y-6">
              {/* Session Overview */}
              {session.plan.objectives && session.plan.objectives.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Session Objectives</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {session.plan.objectives.map((objective: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">{objective}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warm-up */}
              {session.plan.warmUp && (
                <div className="border-l-4 border-orange-400 pl-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Warm-up ({session.plan.warmUp.duration || 15} min)
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{session.plan.warmUp.description}</p>
                    {session.plan.warmUp.instructions && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {session.plan.warmUp.instructions.map((instruction: string, index: number) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}

              {/* Main Activities */}
              {session.plan.mainActivities && Array.isArray(session.plan.mainActivities) && (
                <div className="space-y-4">
                  <h4 className="text-md font-medium text-gray-900">Main Activities</h4>
                  {session.plan.mainActivities.map((activity: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-400 pl-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{activity.name}</h5>
                        <span className="text-sm text-gray-500">{activity.duration} min</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                      
                      {activity.setup && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Setup</p>
                          <p className="text-sm text-gray-600">{activity.setup.organization}</p>
                          {activity.setup.equipment && activity.setup.equipment.length > 0 && (
                            <p className="text-sm text-gray-600">Equipment: {activity.setup.equipment.join(', ')}</p>
                          )}
                        </div>
                      )}

                      {activity.coachingPoints && activity.coachingPoints.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Coaching Points</p>
                          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                            {activity.coachingPoints.map((point: string, pointIndex: number) => (
                              <li key={pointIndex}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Cool Down */}
              {session.plan.coolDown && (
                <div className="border-l-4 border-green-400 pl-4">
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Cool Down ({session.plan.coolDown.duration || 10} min)
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-700">{session.plan.coolDown.description}</p>
                    {session.plan.coolDown.instructions && (
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        {session.plan.coolDown.instructions.map((instruction: string, index: number) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No detailed session plan available.</p>
          )}
        </div>
      )}

      {activeTab === 'edit' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Session</h3>
          <p className="text-gray-500 text-sm">Session editing functionality coming soon...</p>
        </div>
      )}
    </div>
  )
}