# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Youth Soccer AI Platform - A Next.js full-stack application that empowers youth soccer coaches with AI-driven training plans. The project uses a monorepo structure with Turborepo and is deployed using Docker containers orchestrated by Docker Swarm and managed via Portainer.

## Key Commands

### Development
```bash
# Start all services (web app + hot reload)
pnpm dev

# Run specific app in dev mode
pnpm --filter @soccer/web dev
```

### Testing
```bash
# Run all tests
pnpm test

# Run unit tests with coverage
pnpm test:coverage

# Run E2E tests with Playwright
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run a single test file
pnpm vitest run src/lib/auth/actions.test.ts

# Run tests in watch mode
pnpm vitest --watch

# Run tests matching a pattern
pnpm vitest run --testNamePattern="login"
```

### Database Operations
```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes to database (dev)
pnpm db:push

# Run migrations
pnpm db:migrate

# Seed database with test data
pnpm db:seed

# Open Prisma Studio
pnpm db:studio

# Apply Row Level Security policies
pnpm --filter @soccer/web db:rls
```

### Build & Deployment
```bash
# Build all packages
pnpm build

# Type check
pnpm typecheck

# Lint
pnpm lint

# Clean all build artifacts
pnpm clean

# Build Docker image locally
docker build -t soccer-web:latest .

# Run local development with Docker Compose
docker-compose -f docker-compose.dev.yml up

# Deploy to production (via GitHub Actions)
# Merging to main branch triggers automatic deployment
```

## Architecture & Code Structure

### Tech Stack
- **Frontend**: Next.js 14 with App Router, React Server Components, TypeScript
- **Styling**: Tailwind CSS + Radix UI components
- **Backend**: tRPC running inside Next.js API routes
- **Database**: PostgreSQL via Supabase with Prisma ORM
- **Authentication**: Supabase Auth with Row Level Security
- **AI**: OpenAI GPT-4 via n8n workflow orchestration
- **Testing**: Vitest (unit/integration) + Playwright (E2E)
- **Deployment**: Docker containers with Docker Swarm orchestration
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Management**: Portainer for container orchestration

### Key Architectural Patterns

1. **Full-Stack Next.js**: Single deployment unit with API routes as backend
   - All backend logic runs in `/apps/web/src/app/api/`
   - tRPC router at `/apps/web/src/app/api/trpc/[trpc]/route.ts`

2. **Type-Safe API Layer**: tRPC provides end-to-end type safety
   - Router definitions in `/apps/web/src/lib/trpc/routers/`
   - Root router at `/apps/web/src/lib/trpc/root.ts`
   - Client setup at `/apps/web/src/lib/trpc/client.ts`

3. **Multi-Tenant Architecture**: All data is scoped to clubs
   - RLS policies enforce tenant isolation at database level
   - User → UserClub → Club relationship model

4. **Server Actions**: Next.js server actions for forms
   - Auth actions at `/apps/web/src/lib/auth/actions.ts`
   - Always use `'use server'` directive

5. **AI Agent System**: n8n workflows orchestrate 5 specialized agents
   - Coach Winston (session planning)
   - Scout Emma (player development)
   - Physio Alex (health monitoring)
   - Motivator Sam (engagement)
   - Analyst Jordan (analytics)

### Critical Files & Patterns

**Authentication Flow**:
- `/apps/web/src/lib/supabase/server.ts` - Server-side Supabase client
- `/apps/web/src/lib/supabase/client.ts` - Client-side Supabase client
- `/apps/web/src/middleware.ts` - Auth middleware for protected routes

**Database Access**:
- `/apps/web/prisma/schema.prisma` - Database schema
- `/apps/web/src/lib/prisma.ts` - Prisma client singleton
- Always use transactions for multi-table operations

**Testing Patterns**:
- Test setup at `/apps/web/src/test/setup.ts`
- Mocks in `/apps/web/src/test/mocks/`
- E2E tests in `/apps/web/e2e/`
- 80% coverage threshold enforced for unit/integration tests

**Environment Variables**:
- Local: `/apps/web/.env.local`
- Required: `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- AI keys: `OPENAI_API_KEY`, `N8N_WEBHOOK_URL`

### Development Workflow

1. **Feature Development**:
   - Create feature branch from `main`
   - Use server components by default, client components only when needed
   - Follow existing patterns in similar files
   - Run `pnpm typecheck` before committing

2. **Testing Requirements**:
   - Write tests for new features
   - Run `pnpm test` to ensure all pass
   - E2E tests for critical user flows
   - Mock external services (Supabase, Prisma) in unit tests

3. **PR Process**:
   - GitHub Actions run all tests automatically
   - Docker image built and pushed to GitHub Container Registry
   - Preview deployment created via Portainer API
   - E2E tests run against preview environment
   - Requires passing tests + type check + lint

### BMAD Development Method

This project uses the BMAD (Business-Minded Agile Development) method:
- Stories located in `/docs/stories/`
- When assigned a story, load files specified in `.bmad-core/core-config.yaml`
- Follow the task execution order in the story file
- Update only authorized sections (checkboxes, Dev Agent Record)

### Common Gotchas

1. **Prisma Client**: Always run `pnpm db:generate` after schema changes
2. **Environment Variables**: Ensure all required vars are set before running
3. **Type Errors**: Check generated types after API changes
4. **Test Mocks**: Supabase client must return proper promise structure
5. **Server Components**: Can't use hooks or browser APIs
6. **RLS Policies**: Test with different user roles to ensure proper access