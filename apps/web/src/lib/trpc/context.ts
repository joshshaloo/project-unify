import type { prisma } from '../prisma';
import type { User, UserClub, Club } from '@prisma/client';
import type { User as SupabaseUser } from '@supabase/supabase-js';

/**
 * Extended User type with club relationships
 */
export type UserWithClubs = User & {
  clubs: (UserClub & {
    club: Club;
  })[];
};

/**
 * Defines the context available to all tRPC procedures
 */
export interface Context {
  prisma: typeof prisma;
  user?: UserWithClubs | null;
  supabaseUser?: SupabaseUser | null;
}