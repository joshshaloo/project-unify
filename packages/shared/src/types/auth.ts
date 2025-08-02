import type { Role } from './index'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface UserClubRole {
  id: string
  userId: string
  clubId: string
  role: Role
  isPrimary: boolean
  permissions: Record<string, string[]>
  expiresAt?: Date
  createdAt: Date
}

export interface AuthSession {
  user: AuthUser
  roles: UserClubRole[]
  currentRole?: UserClubRole
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  password: string
  name: string
  inviteToken?: string
}