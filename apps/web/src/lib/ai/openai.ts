import OpenAI from 'openai';

// Lazy initialize OpenAI client
let openaiInstance: OpenAI | null = null;

export const getOpenAI = () => {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'dummy-key-for-build',
    });
  }
  return openaiInstance;
};

// Type definitions for session generation
export interface SessionGenerationParams {
  teamId: string;
  ageGroup: string;
  skillLevel: string;
  duration: number; // in minutes
  sessionType: 'training' | 'match_prep' | 'skills';
  focus?: string[]; // e.g., ['passing', 'shooting', 'fitness']
  playerCount?: number;
  equipment?: string[];
  previousSessions?: Array<{
    date: Date;
    focus: string[];
    drills: string[];
  }>;
}

export interface GeneratedDrill {
  name: string;
  category: 'technical' | 'tactical' | 'physical' | 'mental';
  duration: number;
  description: string;
  objectives: string[];
  setup: {
    space: string;
    equipment: string[];
    organization: string;
  };
  instructions: string[];
  coachingPoints: string[];
  progressions?: string[];
}

export interface GeneratedSession {
  title: string;
  objectives: string[];
  warmUp: GeneratedDrill;
  mainActivities: GeneratedDrill[];
  coolDown: GeneratedDrill;
  notes: string;
  totalDuration: number;
}