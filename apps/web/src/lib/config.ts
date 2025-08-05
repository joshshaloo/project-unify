/**
 * Runtime configuration that can be set via environment variables
 * This allows the same Docker image to be used in different environments
 */

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      NEXT_PUBLIC_APP_URL?: string
    }
  }
}

export function getRuntimeConfig() {
  // Server-side: use environment variables directly
  if (typeof window === 'undefined') {
    return {
      NEXT_PUBLIC_APP_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    }
  }
  
  // Client-side: use runtime config from window
  return window.__RUNTIME_CONFIG__ || {
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
  }
}

export function getAppUrl() {
  const config = getRuntimeConfig()
  return config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}