import type { BaseEntity, Role } from './index'

export interface User extends BaseEntity {
  email: string
  name: string
  avatar?: string
  preferences: UserPreferences
  onboardingCompleted: boolean
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: NotificationSettings
  language: string
  timezone: string
}

export interface NotificationSettings {
  email: {
    sessionReminders: boolean
    approvalRequests: boolean
    teamUpdates: boolean
    weeklyDigest: boolean
  }
  push: {
    sessionReminders: boolean
    approvalRequests: boolean
    teamUpdates: boolean
  }
}

export interface UserProfile extends User {
  clubs: ClubMembership[]
  primaryClubId?: string
}

export interface ClubMembership {
  clubId: string
  clubName: string
  role: Role
  isPrimary: boolean
  joinedAt: Date
}