/**
 * Club-related TypeScript type definitions
 */

import { JsonValue } from '@prisma/client/runtime/library'

// Base Club type from Prisma schema
export interface Club {
  id: string
  name: string
  logoUrl?: string | null
  primaryColor?: string | null
  settings: JsonValue
  subscription: string
  createdAt: Date
  updatedAt: Date
}

// UserClub relationship type
export interface UserClub {
  id: string
  userId: string
  clubId: string
  role: string
  status: string
  joinedAt: Date
}

// Extended Club type with user relationship data (from tRPC queries)
export interface ClubWithUserData extends Club {
  role: string
  joinedAt: Date
}

// User roles in clubs
export type ClubRole = 'admin' | 'head_coach' | 'assistant_coach' | 'parent'

// Club member with user data
export interface ClubMember {
  id: string
  email: string
  name?: string | null
  avatarUrl?: string | null
  role: ClubRole
  joinedAt: Date
}