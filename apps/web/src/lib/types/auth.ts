/**
 * Authentication-related TypeScript type definitions
 */

// Return type for auth actions (login, signup)
export interface AuthActionResult {
  error: string
}

// Auth action functions type definitions  
export type LoginAction = (formData: FormData) => Promise<AuthActionResult | undefined>
export type SignupAction = (formData: FormData) => Promise<AuthActionResult | undefined>
export type SignOutAction = () => Promise<void>

// User data type from database
export interface User {
  id: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  supabaseId: string
  onboardingCompleted: boolean
  preferredLanguage: string
  notificationSettings: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
  clubs?: UserClub[]
}

// User club relationship
export interface UserClub {
  id: string
  userId: string
  clubId: string
  role: string
  status: string
  joinedAt: Date
  club: {
    id: string
    name: string
    logoUrl?: string | null
    primaryColor?: string | null
    settings: Record<string, unknown>
    subscription: string
    createdAt: Date
    updatedAt: Date
  }
}

export type GetUserAction = () => Promise<User | null>