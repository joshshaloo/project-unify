import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../procedures';

export const healthRouter = createTRPCRouter({
  check: publicProcedure.query(async ({ ctx }) => {
    // Test database connection
    try {
      await ctx.prisma.$connect();
      await ctx.prisma.$disconnect();
    } catch (error) {
      return {
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
        database: false,
      };
    }

    return {
      status: 'ok',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
      database: true,
    };
  }),

  echo: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      return {
        message: `Echo: ${input.message}`,
        timestamp: new Date().toISOString(),
      };
    }),
});