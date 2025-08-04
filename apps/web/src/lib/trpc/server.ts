import { prisma } from '../prisma';
import { getSession } from '../auth/server';
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
  
  try {
    // Get session from JWT
    const sessionUser = await getSession();
    
    if (sessionUser) {
      // Ensure we have the full user data with clubs
      const dbUser = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        include: {
          clubs: {
            where: { status: 'active' }, // Only include active club memberships
            include: {
              club: true,
            },
          },
        },
      });
      
      if (dbUser) {
        user = dbUser;
      }
    }
  } catch (error) {
    // Log the error for debugging but don't expose it to client
    console.error('Error creating tRPC context:', error);
  }

  return {
    prisma,
    user,
  };
};