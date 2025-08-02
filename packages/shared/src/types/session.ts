import type { BaseEntity, SessionStatus } from './index'
import type { Drill } from './drill'

export interface Session extends BaseEntity {
  teamId: string
  date: Date
  duration: number // minutes
  status: SessionStatus
  theme?: string
  objectives: string[]
  plan: SessionPlan
  feedback?: SessionFeedback
  createdBy: string
  approvedBy?: string
  approvedAt?: Date
}

export interface SessionPlan {
  warmUp: SessionSection
  mainActivities: SessionSection
  coolDown: SessionSection
}

export interface SessionSection {
  duration: number
  activities: SessionActivity[]
}

export interface SessionActivity {
  drillId: string
  drill?: Drill
  duration: number
  order: number
  notes?: string
  modifications?: string[]
}

export interface SessionFeedback {
  rating: number
  notes: string
  attendance: number
  completedActivities: string[]
}