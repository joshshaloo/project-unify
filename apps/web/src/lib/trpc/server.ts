import { TRPCError } from '@trpc/server';
import { prisma } from '../prisma';
import { createClient } from '../supabase/server';
import type { Context } from './context';

/**
 * This is the actual context you will use in your router. It will be used to process every request
 * that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (): Promise<Context> => {
  // Try to get the authenticated user
  let user = undefined;
  let supabaseUser = undefined;
  
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    
    if (data.user) {
      supabaseUser = data.user;
      user = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: {
          clubs: {
            include: {
              club: true,
            },
          },
        },
      });
    }
  } catch (error) {
    // User is not authenticated, continue without user context
  }

  return {
    prisma,
    user,
    supabaseUser,
  };
};