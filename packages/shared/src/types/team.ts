import type { BaseEntity, AgeGroup } from './index'

export interface Team extends BaseEntity {
  clubId: string
  name: string
  ageGroup: AgeGroup
  season: string
  coachIds: string[]
  playerCount: number
  settings: TeamSettings
}

export interface TeamSettings {
  sessionDuration: number // default minutes
  sessionsPerWeek: number
  preferredDays: string[]
  preferredTimes: string[]
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  role: 'player' | 'coach' | 'assistant_coach'
  jerseyNumber?: number
  position?: string
  joinedAt: Date
  isActive: boolean
}