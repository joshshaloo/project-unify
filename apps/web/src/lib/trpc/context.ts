import { prisma } from '../prisma';
import type { User } from '@prisma/client';

/**
 * Defines the context available to all tRPC procedures
 */
export interface Context {
  prisma: typeof prisma;
  user?: User & {
    clubs?: any[];
  } | null;
  supabaseUser?: any;
}