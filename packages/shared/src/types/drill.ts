import type { BaseEntity, DrillCategory, AgeGroup } from './index'

export interface Drill extends BaseEntity {
  clubId?: string // null for default drills
  name: string
  description: string
  category: DrillCategory
  skillFocus: string[]
  ageGroups: AgeGroup[]
  duration: number // minutes
  playersMin: number
  playersMax: number
  
  // YouTube Integration
  videoUrl?: string
  videoId?: string
  thumbnail?: string
  
  // Content
  setup: string
  instructions: string[]
  coachingPoints: string[]
  variations: string[]
  
  // Metadata
  difficulty: 1 | 2 | 3 | 4 | 5
  equipment: string[]
  space: 'small' | 'medium' | 'large'
  
  createdBy: string
  isActive: boolean
}

export interface DrillFilters {
  clubId?: string
  category?: DrillCategory
  ageGroup?: AgeGroup
  skillFocus?: string[]
  difficulty?: number
  searchTerm?: string
}