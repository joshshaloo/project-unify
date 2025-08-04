# API Specification

## tRPC Router Structure (Inside Next.js)

```typescript
// apps/web/src/server/api/root.ts
import { createTRPCRouter } from './trpc';
import { authRouter } from './routers/auth';
import { clubRouter } from './routers/club';
import { sessionRouter } from './routers/session';
import { drillRouter } from './routers/drill';
import { playerRouter } from './routers/player';
import { aiRouter } from './routers/ai';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  club: clubRouter,
  session: sessionRouter,
  drill: drillRouter,
  player: playerRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
```

## Next.js API Route Handler

```typescript
// apps/web/src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```
