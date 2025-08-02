'use client';

import { useState } from 'react';

export default function TestTRPCPage() {
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const testTRPC = async () => {
    setLoading(true);
    try {
      // Test the tRPC endpoint directly
      const res = await fetch('/api/trpc/health.check', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">tRPC Test Page</h1>
      
      <button 
        onClick={testTRPC}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testing...' : 'Test tRPC Health Check'}
      </button>
      
      {response && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Response:</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}