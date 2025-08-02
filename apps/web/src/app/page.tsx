'use client';

import { trpc } from '@/lib/trpc';

export default function HomePage() {
  const healthCheck = trpc.health.check.useQuery();
  const echoQuery = trpc.health.echo.useQuery(
    { message: 'Hello tRPC!' },
    { enabled: healthCheck.isSuccess }
  );

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Project Unify</h1>
        <p className="text-xl text-gray-600 mb-8">
          Youth Soccer AI Platform
        </p>
        
        <div className="mb-8 p-6 bg-gray-100 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">tRPC Health Check</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">System Status:</h3>
              {healthCheck.isLoading && <p>Loading...</p>}
              {healthCheck.error && (
                <p className="text-red-600">Error: {healthCheck.error.message}</p>
              )}
              {healthCheck.data && (
                <div className="text-left bg-white p-3 rounded border">
                  <p><strong>Status:</strong> {healthCheck.data.status}</p>
                  <p><strong>Database:</strong> {healthCheck.data.database ? '✅ Connected' : '❌ Disconnected'}</p>
                  <p><strong>Message:</strong> {healthCheck.data.message}</p>
                  <p><strong>Time:</strong> {healthCheck.data.timestamp}</p>
                </div>
              )}
            </div>

            <div>
              <h3 className="font-medium">Echo Test:</h3>
              {echoQuery.isLoading && <p>Loading...</p>}
              {echoQuery.error && (
                <p className="text-red-600">Error: {echoQuery.error.message}</p>
              )}
              {echoQuery.data && (
                <div className="text-left bg-white p-3 rounded border">
                  <p><strong>Response:</strong> {echoQuery.data.message}</p>
                  <p><strong>Time:</strong> {echoQuery.data.timestamp}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-gray-500 mb-8">
          🚧 Under Construction - Sprint 1 Development 🚧
        </p>
        
        <div className="flex gap-4 justify-center">
          <a
            href="/auth/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
          >
            Sign In
          </a>
          <a
            href="/auth/signup"
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-500"
          >
            Create Account
          </a>
        </div>
      </div>
    </main>
  )
}