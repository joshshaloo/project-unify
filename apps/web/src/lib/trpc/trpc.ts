import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { type Context } from './context';
import { ROLES, hasMinimumRole, getUserRoleInClub, type Role } from '../auth/roles';

/**
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure;

/**
 * Middleware to create protected procedures
 */
export const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource',
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Protected (authenticated) procedure
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Middleware to enforce club membership
 */
export const enforceClubMembership = (clubId: string) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const userClub = ctx.user.clubs?.find(
      (uc: any) => uc.clubId === clubId && uc.status === 'active'
    );

    if (!userClub) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this club',
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        userClub,
      },
    });
  });

/**
 * Middleware to enforce minimum role in a club
 */
export const enforceMinimumRole = (clubId: string, requiredRole: Role) =>
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be logged in to access this resource',
      });
    }

    const userRole = getUserRoleInClub(ctx.user.clubs || [], clubId);

    if (!userRole) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have access to this club',
      });
    }

    if (!hasMinimumRole(userRole, requiredRole)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `You need at least ${requiredRole} role to access this resource`,
      });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
        userRole,
      },
    });
  });

/**
 * Role-based procedures
 */
export const adminProcedure = (clubId: string) =>
  t.procedure.use(enforceUserIsAuthed).use(enforceMinimumRole(clubId, ROLES.ADMIN));

export const headCoachProcedure = (clubId: string) =>
  t.procedure.use(enforceUserIsAuthed).use(enforceMinimumRole(clubId, ROLES.HEAD_COACH));

export const assistantCoachProcedure = (clubId: string) =>
  t.procedure.use(enforceUserIsAuthed).use(enforceMinimumRole(clubId, ROLES.ASSISTANT_COACH));

export const parentProcedure = (clubId: string) =>
  t.procedure.use(enforceUserIsAuthed).use(enforceMinimumRole(clubId, ROLES.PARENT));

export const clubMemberProcedure = (clubId: string) =>
  t.procedure.use(enforceUserIsAuthed).use(enforceClubMembership(clubId));