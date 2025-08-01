// Common types used across the application

export type Role = 'doc' | 'head_coach' | 'assistant_coach' | 'parent' | 'player'

export type SessionStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'completed'

export type DrillCategory = 
  | 'technical'
  | 'tactical' 
  | 'physical'
  | 'mental'
  | 'warm_up'
  | 'cool_down'
  | 'game'

export type AgeGroup = 'U6' | 'U8' | 'U10' | 'U12' | 'U14' | 'U16' | 'U18'

export type SubscriptionTier = 'trial' | 'basic' | 'pro' | 'enterprise'

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}