# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Quick Start
```bash
# Start everything (database, services, and app)
make dev

# Run tests
make test                    # All tests
pnpm test --filter @soccer/web      # Unit tests only
pnpm test:e2e --filter @soccer/web  # E2E tests only

# Type checking and linting
make typecheck              # Check all workspaces
pnpm typecheck --filter @soccer/web  # Check specific workspace
pnpm lint                   # Run ESLint
pnpm lint:fix              # Auto-fix linting issues

# Database operations
make migrate               # Run migrations
make seed                  # Seed development data
make db                    # Connect to PostgreSQL
make db-reset             # Reset database (requires confirmation)
```

### Deployment Commands
```bash
# Deploy to environments
make preview              # Deploy to preview environment
make prod                # Deploy to production (requires "deploy-to-prod" confirmation)

# Check deployment status
make status              # Show running services
make health             # Health check all services
make logs               # View logs (use s=service for specific service)
```

## High-Level Architecture

### Self-Hosted Docker Swarm Architecture
The project runs entirely in a home lab using Docker Swarm orchestration, with Cloudflare Zero Trust providing secure public access. This architecture was chosen to minimize costs during MVP validation while maintaining professional-grade infrastructure.

**Key Components:**
- **Next.js 15.4 Full-Stack App**: Containerized with multi-stage Docker builds
- **PostgreSQL 17.5**: Self-hosted in Docker containers for all environments
- **Redis 8.2**: Caching layer, also containerized
- **n8n Workflows**: AI agent orchestration platform (containerized)
- **Magic Link Auth**: Custom email-based authentication (no external auth providers)
- **NFS Volumes on TrueNAS**: Persistent storage at `/mnt/truenas/docker_volumes/project-unity/{preview,prod}`

### AI Agent System via n8n
The platform uses n8n for visual workflow-based AI orchestration with 5 specialized agents:
- **Coach Winston**: Strategic session planning
- **Scout Emma**: Player development tracking
- **Physio Alex**: Health monitoring
- **Motivator Sam**: Team morale optimization
- **Analyst Jordan**: Performance analytics

Agents are invoked through n8n webhooks from the Next.js app and communicate with OpenAI GPT-4.

### Deployment Pipeline
```
GitHub Push → GitHub Actions → Docker Build → ghcr.io → Portainer API → Docker Swarm
```
- CI/CD uses Tailscale for secure GitHub-to-homelab connection
- All deployments managed through Portainer API
- Environment separation: dev (local), preview (single shared), prod

### Database Strategy
- **Consistent naming**: All environments use database name `soccer` and user `postgres`
- **Environment isolation**: Each environment has its own PostgreSQL container
- **Backup automation**: Daily backups to NFS volumes
- **Connection pooling**: Via PgBouncer for production

## Project Structure

### Monorepo Layout
```
project-unify/
├── apps/
│   └── web/                 # Next.js full-stack application
│       ├── src/
│       │   ├── app/        # App Router pages
│       │   ├── components/ # React components
│       │   ├── server/     # tRPC API routers
│       │   └── lib/        # Utilities and config
│       ├── prisma/         # Database schema and migrations
│       └── public/         # Static assets
├── packages/
│   ├── shared/             # Shared TypeScript types
│   ├── ui/                 # Shared UI components
│   └── config/             # Shared configurations
├── docs/                   # Architecture and documentation
│   └── sharded/           # Sharded design documents
├── docker-compose.dev.yml  # Local development services
├── docker-stack.*.yml      # Swarm deployment configs
├── Makefile               # Developer interface
└── turbo.json             # Turborepo configuration
```

### Key Architecture Decisions

1. **tRPC Inside Next.js**: Type-safe API calls without separate backend
   - Router definition: `apps/web/src/server/api/root.ts`
   - API route handler: `apps/web/src/app/api/trpc/[trpc]/route.ts`

2. **Prisma Schema**: Central data model at `apps/web/prisma/schema.prisma`
   - Multi-tenant architecture with Club as root tenant
   - Soft deletes and audit fields on all models

3. **Authentication Flow**: Magic links stored in PostgreSQL
   - No external auth providers (Supabase Auth removed)
   - JWT sessions with httpOnly cookies

4. **Environment Configuration**:
   - Local: `.env.local` with MailHog for emails
   - Preview/Prod: Environment variables via Portainer

## Code Standards Overview

The project follows strict coding standards documented in `/docs/sharded/implementation/coding-standards.md`:

- **Philosophy**: KISS, DRY, YAGNI principles with SOLID applied to TypeScript/React
- **Critical Rules**:
  - All types must be imported from `@soccer/shared/types`
  - API calls must use tRPC (no direct fetch)
  - Environment variables accessed via config objects
  - Multi-tenancy filters required on all queries
  - Permissions checked server-side, not just UI
- **Testing**: Required for all new features, use Vitest for unit tests and Playwright for E2E
- **Git Conventions**: Conventional commits (feat:, fix:, docs:, etc.)

## Environment Setup

### Required Environment Variables
```bash
# Database (consistent across environments)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<environment-specific>
POSTGRES_DB=soccer

# Application
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=<environment-url>
OPENAI_API_KEY=sk-...

# Email
EMAIL_SERVER_HOST=<mailhog or smtp>
EMAIL_SERVER_PORT=<1025 or 587>
EMAIL_FROM=noreply@soccer-unify.com
```

### Service URLs by Environment
- **Development**: 
  - App: http://localhost:3000
  - MailHog: http://localhost:8025
  - n8n: http://localhost:5678
- **Preview**: https://preview.soccer-unify.com (via Cloudflare)
- **Production**: https://soccer-unify.com (via Cloudflare)

## Testing Strategy

```bash
# Run unit tests for a specific component
pnpm test src/components/SessionCard.test.tsx

# Run integration tests
pnpm test:integration

# Run E2E tests with UI
pnpm test:e2e:ui

# Generate coverage report
pnpm test:coverage
```

Tests follow the pattern: `[filename].test.tsx` for unit tests, `[feature].e2e.ts` for E2E tests.

## Debugging Tips

1. **Container Issues**: Check logs with `make logs s=<service>`
2. **Database Connection**: Verify with `make health`, connect with `make db`
3. **Build Failures**: Clear caches with `pnpm clean && pnpm install`
4. **Type Errors**: Run `pnpm typecheck` to identify issues
5. **Deployment Stuck**: Check Portainer UI and GitHub Actions logs

## Performance Considerations

- **React Server Components**: Use for initial page loads
- **Redis Caching**: Implemented for session data and API responses
- **Image Optimization**: Use Next.js Image component
- **Database Indexes**: Defined in Prisma schema
- **Docker Resource Limits**: Set in stack files to prevent memory leaks

## Security Notes

- All secrets stored in Portainer secrets or GitHub Actions secrets
- No ports exposed on home network (Cloudflare Zero Trust handles access)
- Database connections restricted to Docker network
- Magic link tokens expire after 10 minutes
- Rate limiting implemented via Redis