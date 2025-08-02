// This file exports tRPC procedures for use in routers
// It re-exports from trpc.ts to avoid circular dependencies

export { 
  createTRPCRouter, 
  publicProcedure, 
  protectedProcedure,
  createCallerFactory,
  adminProcedure,
  headCoachProcedure,
  assistantCoachProcedure,
  parentProcedure,
  clubMemberProcedure,
  enforceMinimumRole,
  enforceClubMembership
} from './trpc';