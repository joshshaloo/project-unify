import { createCallerFactory, createTRPCRouter } from './procedures';
import { healthRouter } from './routers/health';
import { authRouter } from './routers/auth';
import { invitationRouter } from './routers/invitation';
import { clubsRouter } from './routers/clubs';
import { aiRouter } from './routers/ai';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  auth: authRouter,
  invitation: invitationRouter,
  clubs: clubsRouter,
  ai: aiRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);