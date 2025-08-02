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
  // Get the authenticated user with proper error handling
  let user: Context['user'] = null;
  let supabaseUser: Context['supabaseUser'] = null;
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    
    // If there's an auth error, log it but don't throw (allow unauthenticated requests)
    if (error) {
      console.warn('Supabase auth error:', error.message);
      return {
        prisma,
        user: null,
        supabaseUser: null,
      };
    }
    
    if (data.user) {
      supabaseUser = data.user;
      
      // Validate that the user exists in our database
      const dbUser = await prisma.user.findUnique({
        where: { supabaseId: data.user.id },
        include: {
          clubs: {
            where: { status: 'active' }, // Only include active club memberships
            include: {
              club: true,
            },
          },
        },
      });
      
      // If user exists in Supabase but not in our DB, they need to complete signup
      if (!dbUser) {
        console.warn('User exists in Supabase but not in database:', data.user.id);
        return {
          prisma,
          user: null,
          supabaseUser,
        };
      }
      
      user = dbUser;
    }
  } catch (error) {
    // Log the error for debugging but don't expose it to client
    console.error('Error creating tRPC context:', error);
    // Return safe context for unauthenticated requests
    return {
      prisma,
      user: null,
      supabaseUser: null,
    };
  }

  return {
    prisma,
    user,
    supabaseUser,
  };
};