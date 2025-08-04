# Youth Soccer AI Platform Fullstack Architecture Document

This document outlines the complete fullstack architecture for Youth Soccer AI Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

N/A - Greenfield project

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-01 | 1.0 | Initial architecture document | Alex, Design Architect |
| 2025-08-02 | 1.1 | Simplified to Next.js full-stack for MVP | Winston, Architect |
| 2025-08-02 | 1.2 | Added n8n-based AI agent orchestration | Winston, Architect |
| 2025-08-03 | 2.0 | Major pivot to home lab self-hosting with Docker Swarm | Winston, Architect |
| 2025-08-04 | 2.1 | Updated authentication from magic links to NextAuth | Winston, Architect |

## High Level Architecture

### Technical Summary

The Youth Soccer AI Platform employs a cost-effective self-hosted architecture designed for MVP deployment in a home lab environment. The system uses Next.js as a full-stack framework, containerized with Docker and orchestrated via Docker Swarm. All environments (local, preview, production) run on self-hosted infrastructure with PostgreSQL in Docker containers, eliminating cloud database costs during the MVP phase.

For AI capabilities, we utilize n8n as our agent orchestration platform, enabling visual workflow design for our five specialized AI agents (Coach Winston, Scout Emma, Physio Alex, Motivator Sam, and Analyst Jordan). These agents communicate through n8n workflows, calling OpenAI's GPT-4 and other services, with results stored in our PostgreSQL database.

**MVP Architecture Philosophy:** Self-host everything possible to validate the product before incurring cloud costs. The architecture is designed to be easily migrated to cloud providers once the product proves successful.

### Platform and Infrastructure Choice

**Platform:** Docker Swarm (Container Orchestration) + Cloudflare Zero Trust (SSL & Routing)
**Key Services:** 
- Docker Swarm (Container orchestration in home lab)
- PostgreSQL (Containerized database for all environments)
- n8n (AI Agent Workflows - containerized)
- Cloudflare Zero Trust (SSL tunnels and domain routing)
- GitHub Container Registry (Image storage)
- Portainer (Container management API)
- MailHog/SMTP (Email services - containerized)

**Deployment Infrastructure:** 
- Primary: Home lab with Docker Swarm cluster
- Access: Cloudflare Zero Trust tunnels for public access
- CI/CD: GitHub Actions → Docker build → ghcr.io → Portainer API deployment
- Secure Connection: Tailscale for GitHub to home lab communication

**Future Scale Path:** When ready to scale, the containerized architecture allows easy migration to any cloud provider (AWS ECS, Google Cloud Run, Azure Container Instances) with minimal changes

### Repository Structure

**Structure:** Monorepo
**Monorepo Tool:** Turborepo (optimized build caching and parallel execution)
**Package Organization:** 
- Apps: web (Next.js full-stack)
- Packages: shared (types), ui (components), db (Prisma schema)

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[Progressive Web App<br/>Next.js Client]
        Mobile[Mobile Browser<br/>PWA]
    end
    
    subgraph "Cloudflare Zero Trust"
        CF[Cloudflare Tunnel<br/>SSL + Routing]
    end
    
    subgraph "Home Lab Infrastructure"
        subgraph "Docker Swarm Cluster"
            subgraph "Application Stack"
                App1[Next.js App<br/>Container 1]
                App2[Next.js App<br/>Container 2]
                AppN[Next.js App<br/>Container N]
            end
            
            subgraph "Data Layer"
                PG[(PostgreSQL<br/>Primary)]
                Redis[(Redis<br/>Cache)]
                MailHog[MailHog<br/>Email Service]
            end
            
            subgraph "AI Platform"
                n8n[n8n Workflow<br/>Engine]
                subgraph "AI Agents"
                    Winston[Coach Winston]
                    Emma[Scout Emma]
                    Alex[Physio Alex]
                    Sam[Motivator Sam]
                    Jordan[Analyst Jordan]
                end
            end
        end
        
        Portainer[Portainer<br/>Management API]
    end
    
    subgraph "External Services"
        GPT[OpenAI GPT-4<br/>API]
        YT[YouTube API]
        SMTP[External SMTP<br/>(Production Only)]
    end
    
    subgraph "CI/CD Pipeline"
        GH[GitHub Actions]
        GHCR[GitHub Container<br/>Registry]
        TS[Tailscale<br/>Secure Tunnel]
    end
    
    PWA --> CF
    Mobile --> CF
    CF --> App1
    CF --> App2
    CF --> AppN
    
    App1 --> PG
    App2 --> PG
    AppN --> PG
    App1 --> Redis
    App1 --> n8n
    
    n8n --> Winston
    n8n --> Emma
    n8n --> Alex
    n8n --> Sam
    n8n --> Jordan
    
    Winston --> GPT
    n8n --> PG
    n8n --> YT
    n8n --> MailHog
    
    GH --> GHCR
    GH --> TS
    TS --> Portainer
```

### Architectural Patterns

- **Containerized Everything:** All services run in Docker containers - _Rationale:_ Consistent environments, easy deployment, simple scaling
- **Self-Hosted MVP:** Complete control over infrastructure during validation phase - _Rationale:_ Zero cloud costs until product-market fit is proven
- **Docker Swarm Orchestration:** Simple container orchestration - _Rationale:_ Easier than Kubernetes for small deployments, built into Docker
- **Multi-Stage Docker Builds:** Testing integrated into build process - _Rationale:_ Catch issues before deployment, ensures quality
- **NextAuth Email Authentication:** Email-based passwordless auth via NextAuth - _Rationale:_ Industry-standard authentication with email provider, automatic session management
- **PostgreSQL for All Environments:** Consistent database across dev/preview/prod - _Rationale:_ Eliminates environment-specific bugs, simple backup strategy
- **Cloudflare Zero Trust:** Secure public access to home lab - _Rationale:_ Enterprise-grade security without complexity
- **GitOps Deployment:** GitHub Actions drives all deployments - _Rationale:_ Version-controlled, auditable, automated deployments
- **Offline-First PWA:** Service workers with background sync - _Rationale:_ Critical for coaches using app on fields without reliable internet

## Tech Stack

| Category | Technology | Version | Purpose | MVP Rationale |
|----------|------------|---------|---------|---------------|
| Language | TypeScript | 5.3+ | Type-safe development | Shared types across full stack |
| Framework | Next.js | 14.2+ | Full-stack React framework | Containerized for consistent deployment |
| UI Library | Radix UI + Tailwind | Latest | Accessible components + utility CSS | Rapid development with accessibility built-in |
| State Management | Zustand + React Query | Latest | Client state + server cache | Simple, lightweight, perfect for MVP |
| API Layer | tRPC | 11.0+ | Type-safe API | Runs inside Next.js API routes |
| Database | PostgreSQL | 15+ | Primary data storage | Self-hosted in Docker, full control |
| ORM | Prisma | 5.0+ | Database toolkit | Type-safe queries, migrations |
| Cache | Redis | 7+ | In-memory cache | Self-hosted in Docker container |
| File Storage | Local Volume | N/A | Media storage | Docker volumes, S3-compatible later |
| Authentication | NextAuth | 5.0+ | Passwordless auth | Industry-standard with email provider |
| AI Orchestration | n8n | Latest | Visual workflow automation | Self-hosted in Docker container |
| AI | OpenAI API | Latest | GPT-4 access | Called via n8n workflows |
| Email | MailHog (dev) / SMTP | Latest | Email service | MailHog for dev/preview, SMTP for prod |
| Testing | Vitest + Playwright | Latest | Unit/E2E testing | Fast, modern testing |
| Container | Docker | 24+ | Containerization | Consistent environments |
| Orchestration | Docker Swarm | Built-in | Container orchestration | Simple clustering solution |
| CI/CD | GitHub Actions | Latest | Automation | Build, test, and deploy pipeline |
| Tunneling | Cloudflare Zero Trust | Latest | Secure access | SSL and public routing |
| Deployment | Portainer | 2.19+ | Container management | API-driven deployments |
| Monitoring | Prometheus + Grafana | Latest | Metrics & visualization | Self-hosted monitoring stack |

## Data Models

[Keep existing data models section unchanged]

## Database Architecture

### PostgreSQL Configuration

**Environment Separation:**
- Each environment gets its own PostgreSQL database
- Databases are isolated in separate containers
- No shared data between environments

**Connection Management:**
```yaml
# Local Development (.env.local)
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:5432/${POSTGRES_DB}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=soccer

# Preview Environment (set via Portainer/GitHub Actions)
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=soccer

# Production (set via Portainer secrets)
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<secure-password>
POSTGRES_DB=soccer
```

**Backup Strategy:**
```bash
# Automated daily backups via cron (runs on Docker host)
# Production backups
0 2 * * * docker exec $(docker ps -qf "name=postgres" -f "label=com.docker.swarm.service.name=project-unity_prod_postgres") pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > /mnt/truenas/docker_volumes/project-unity/prod/backups/${POSTGRES_DB}_$(date +%Y%m%d).sql.gz

# Preview backups (before each deployment)
docker exec $(docker ps -qf "name=postgres" -f "label=com.docker.swarm.service.name=project-unity_preview_postgres") pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > /mnt/truenas/docker_volumes/project-unity/preview/backups/${POSTGRES_DB}_$(date +%Y%m%d_%H%M%S).sql.gz

# Retention: Keep 30 days of backups
find /mnt/truenas/docker_volumes/project-unity/*/backups -name "*.sql.gz" -mtime +30 -delete

# Restore procedure
gunzip < /mnt/truenas/docker_volumes/project-unity/prod/backups/${POSTGRES_DB}_20250103.sql.gz | docker exec -i $(docker ps -qf "name=postgres" -f "label=com.docker.swarm.service.name=project-unity_prod_postgres") psql -U ${POSTGRES_USER} ${POSTGRES_DB}
```

**Migration Management:**
```json
{
  "db:migrate:dev": "prisma migrate dev",
  "db:migrate:deploy": "prisma migrate deploy",
  "db:seed": "prisma db seed",
  "db:reset": "prisma migrate reset --force"
}
```

**Performance Optimization:**
- Connection pooling via PgBouncer
- Appropriate indexes via Prisma schema
- Query monitoring with pg_stat_statements
- Regular VACUUM and ANALYZE

### NextAuth Schema Tables

NextAuth automatically creates and manages the following authentication tables through the Prisma adapter:

```prisma
// NextAuth required tables (managed by @auth/prisma-adapter)
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([provider, providerAccountId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  
  @@unique([identifier, token])
  @@map("verification_tokens")
}
```

## API Specification

### tRPC Router Structure (Inside Next.js)

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

### Next.js API Route Handler

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

## System Components

### Next.js Full-Stack Application (Containerized)

**Responsibility:** Complete web application serving both frontend and API
**Key Features:**
- Server Components for initial page loads
- Client Components for interactivity  
- API routes running tRPC
- Containerized with multi-stage Docker builds
- Built-in image optimization
- Automatic code splitting
- Health check endpoints for container orchestration

**Technology Stack:** Next.js 14+, React 18+, TypeScript, tRPC, Docker

### Authentication (NextAuth)

**Responsibility:** Passwordless authentication via email using NextAuth
**Key Features:**
- Email provider for passwordless authentication
- Database session management via Prisma adapter
- Secure token generation and verification
- Email-based user verification (magic links)
- Automatic user account creation
- Cookie-based session persistence with CSRF protection
- Built-in security features (rate limiting, token rotation)

**Technology Stack:** NextAuth 5.0+ with Nodemailer provider, Prisma adapter, PostgreSQL

### Database Layer

**Responsibility:** Data persistence and queries
**Key Features:**
- Prisma ORM for type-safe queries
- PostgreSQL in Docker container
- Automatic migrations via Prisma
- Connection pooling with pgBouncer
- Backup via Docker volume snapshots
- Consistent across all environments

**Technology Stack:** Prisma 5+, PostgreSQL 15+, Docker volumes

### AI Agent System (via n8n)

**Responsibility:** Multi-agent AI orchestration for intelligent coaching assistance
**Architecture:** Visual workflow-based agent system using n8n

**AI Agents:**
1. **Coach Winston** - Strategic session planning and drill progression
2. **Scout Emma** - Player development tracking and personalization
3. **Physio Alex** - Health monitoring and load management
4. **Motivator Sam** - Team morale and engagement optimization
5. **Analyst Jordan** - Performance analytics and insights

**Key Features:**
- Visual workflow design for rapid iteration
- Agent memory persistence in Supabase
- Multi-agent collaboration patterns
- Webhook-based communication with Next.js
- Parallel agent execution for complex tasks
- Built-in error handling and retries

**n8n Workflow Patterns:**
```yaml
Base Agent Template:
  - Webhook trigger (from Next.js)
  - Context retrieval (Supabase)
  - Agent personality injection
  - OpenAI completion
  - Response processing
  - Memory update
  - Webhook response

Multi-Agent Orchestration:
  - Parallel agent invocation
  - Result synthesis
  - Conflict resolution
  - Final output generation
```

**Integration with Next.js:**
```typescript
// Invoke n8n workflow from tRPC
const n8nClient = new N8NWorkflowClient();
const session = await n8nClient.triggerWorkflow(
  'coach-winston-session-generator',
  { teamId, duration, focus }
);
```

## Environment Variables

### Required Environment Variables by Environment

#### Local Development (.env.local)
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=soccer

# App
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soccer
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/soccer
NEXTAUTH_SECRET=development-secret-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Email (MailHog)
EMAIL_SERVER_HOST=localhost
EMAIL_SERVER_PORT=1025
EMAIL_FROM=noreply@soccer.local

# AI
OPENAI_API_KEY=sk-...

# n8n (optional)
N8N_DB_NAME=n8n
```

#### Preview Environment (Portainer Variables)
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${PREVIEW_DB_PASSWORD}
POSTGRES_DB=soccer

# App
GITHUB_REPOSITORY=username/soccer-app
GITHUB_SHA=latest
NEXTAUTH_SECRET=${SHARED_NEXTAUTH_SECRET}
NEXTAUTH_URL=https://preview.soccer-unify.com
OPENAI_API_KEY=${SHARED_OPENAI_KEY}

# Email (MailHog)
EMAIL_SERVER_HOST=mailhog
EMAIL_SERVER_PORT=1025
EMAIL_FROM=noreply@preview.soccer-unify.com

# n8n
N8N_DB_NAME=n8n
```

#### Production Environment (Portainer Secrets)
```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=${PROD_DB_PASSWORD}
POSTGRES_DB=soccer

# App
VERSION=v1.0.0
APP_URL=https://soccer-unify.com
APP_DOMAIN=soccer-unify.com
NEXTAUTH_SECRET=${PROD_NEXTAUTH_SECRET}
OPENAI_API_KEY=${PROD_OPENAI_KEY}

# Email (Real SMTP)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=${SENDGRID_API_KEY}
EMAIL_FROM=noreply@soccer-unify.com

# n8n
N8N_USER=admin
N8N_PASSWORD=${N8N_ADMIN_PASSWORD}
N8N_HOST=n8n.soccer-unify.com
N8N_DOMAIN=n8n.soccer-unify.com
N8N_WEBHOOK_URL=https://n8n.soccer-unify.com
N8N_DB_NAME=n8n
```

## Infrastructure Components

### Docker Swarm Cluster

**Responsibility:** Container orchestration and service management
**Key Features:**
- Multi-node cluster support (single node for MVP)
- Service scaling and load balancing
- Rolling updates with zero downtime
- Health check monitoring
- Secret management
- Network isolation between services

### NFS Volume Structure

**TrueNAS Volume Layout:**
```
/mnt/truenas/docker_volumes/project-unity/
├── preview/
│   ├── postgres/          # Preview database data
│   ├── redis/             # Preview cache data
│   ├── n8n/               # Preview n8n workflows
│   ├── uploads/           # Preview user uploads
│   └── backups/           # Preview database backups
└── prod/
    ├── postgres/          # Production database data
    ├── redis/             # Production cache data
    ├── n8n/               # Production n8n workflows
    ├── uploads/           # Production user uploads
    └── backups/           # Production database backups
```

**Benefits:**
- Centralized storage on TrueNAS with snapshots
- Easy backup and restore procedures
- Persistent data across container recreations
- Shared storage for multi-node Swarm (future)

**Configuration Example:**
```yaml
version: '3.8'
services:
  app:
    image: ghcr.io/username/soccer-app:latest
    deploy:
      replicas: 2
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

### Cloudflare Zero Trust Tunnels

**Responsibility:** Secure public access to home lab services
**Key Features:**
- No exposed ports on home network
- Built-in DDoS protection
- SSL certificates managed by Cloudflare
- Multiple domain support
- Access policies and authentication rules

### Portainer Management

**Responsibility:** Container deployment and management API
**Key Features:**
- RESTful API for deployments
- Stack (docker-compose) management
- Service monitoring and logs
- Volume and network management
- Webhook support for GitOps

## Deployment Architecture

### Development Workflow

```mermaid
graph LR
    Dev[Local Development] --> Commit[Git Commit]
    Commit --> PR[Pull Request]
    PR --> GHA[GitHub Actions]
    GHA --> Build[Docker Build<br/>+ Run Tests]
    Build --> GHCR[Push to ghcr.io]
    GHCR --> Deploy[Deploy via Portainer]
    Deploy --> Preview[Preview Environment]
    Preview --> E2E[Run E2E Tests]
    E2E --> Review[Code Review]
    Review --> Merge[Merge to Main]
    Merge --> Prod[Production Deploy]
```

### Environment Strategy

1. **Local Development (docker-compose.dev.yml):**
   - **App:** Run directly with `pnpm dev` for hot reloading and debugging
   - **Services:** PostgreSQL, Redis, MailHog, n8n in Docker containers
   - **Database:** `soccer` database with seed data
   - **Email:** MailHog captures all emails locally
   - **Access:** http://localhost:3000

2. **Preview Deployment (docker-stack.preview.yml):**
   - **App:** Production build from GitHub Container Registry
   - **Deployment:** Single preview environment via Portainer API
   - **Database:** `soccer` database (reset on each deployment)
   - **Email:** MailHog for testing (no real emails sent)
   - **Tests:** Full E2E test suite runs after deployment
   - **Access:** https://preview.soccer-unify.com via Cloudflare

3. **Production (docker-stack.prod.yml):**
   - **App:** Production build with 3 replicas for high availability
   - **Deployment:** Main branch auto-deploys via Portainer
   - **Database:** `soccer` database with automated backups
   - **Email:** Real SMTP service for transactional emails
   - **Monitoring:** Prometheus + Grafana enabled
   - **Access:** https://soccer-unify.com via Cloudflare

### Multi-Stage Docker Build

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma generate
RUN pnpm build

# Stage 3: Test
FROM builder AS tester
RUN pnpm test:unit
RUN pnpm test:integration

# Stage 4: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### GitHub Actions CI/CD

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          target: runner
          
  deploy:
    needs: build-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via Portainer
        uses: tailscale/github-action@v2
        with:
          oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
          oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
          tags: tag:ci
          
      - name: Deploy to Swarm
        run: |
          curl -X POST \
            -H "X-API-Key: ${{ secrets.PORTAINER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"image": "${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}"}' \
            https://portainer.internal/api/stacks/soccer-app/update
```

## Migration Path to Scale

When the MVP proves successful and needs to scale:

### Phase 1: Optimize Current Infrastructure
1. **Add more Swarm nodes** to distribute load
2. **Implement PostgreSQL read replicas** for query scaling
3. **Add Redis Sentinel** for cache high availability
4. **Upgrade home internet** bandwidth if needed

### Phase 2: Hybrid Cloud Migration
1. **Move PostgreSQL to managed service** (RDS, Cloud SQL, or Supabase)
2. **Add CDN** (Cloudflare) for static assets
3. **Keep compute in home lab** to control costs
4. **Add cloud backup** for disaster recovery

### Phase 3: Full Cloud Migration
1. **Migrate to Kubernetes** (EKS, GKE, or AKS)
2. **Use managed services** for all infrastructure
3. **Implement auto-scaling** based on load
4. **Add multi-region support** for global users

The containerized architecture ensures smooth migration at each phase.

## Security Considerations

### Infrastructure Security
- **Cloudflare Zero Trust:** No exposed ports, DDoS protection
- **Tailscale VPN:** Encrypted CI/CD connections
- **Docker Secrets:** Sensitive data management
- **Network Isolation:** Separate networks for services

### Application Security
- **NextAuth Email Authentication:** No passwords to compromise, industry-standard security
- **Database Sessions:** Secure, server-side session management with automatic cleanup
- **CSRF Protection:** Built-in CSRF protection via NextAuth
- **Token Security:** Cryptographically secure tokens with automatic rotation
- **HTTPS Only:** Enforced via Cloudflare
- **Environment Variables:** Injected at runtime, not in images
- **Rate Limiting:** Redis-based request throttling
- **CORS Configuration:** Strict origin policies

### Data Security
- **Encrypted Backups:** Automated daily backups
- **Volume Encryption:** Docker volume encryption
- **Database Connection:** SSL/TLS required
- **Audit Logging:** All auth events logged

## Performance Optimization

### Container Optimization
- **Multi-stage builds:** Minimal production images
- **Layer caching:** Faster builds and deployments
- **Health checks:** Automatic container recovery
- **Resource limits:** Prevent memory leaks

### Application Performance
- **Static Generation:** For marketing pages
- **ISR:** For drill library and content
- **React Server Components:** Reduce client bundle
- **Redis Caching:** Session and API response caching
- **Image Optimization:** Next.js built-in optimization
- **Database Indexes:** Via Prisma schema
- **Connection Pooling:** PgBouncer for database

### Infrastructure Performance
- **Load Balancing:** Docker Swarm service distribution
- **Service Scaling:** Docker Swarm replicas
- **Volume Performance:** SSD storage for databases
- **Network Optimization:** Local container communication

## Development Setup

```bash
# Clone repository
git clone <repo>
cd project-unify

# Setup environment
cp apps/web/.env.example apps/web/.env.local

# Start local infrastructure (just services, not the app)
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
pnpm install

# Run database migrations
pnpm db:push

# Seed development data
pnpm db:seed

# Start development (with hot reload)
pnpm dev

# Access services
# - App: http://localhost:3000
# - MailHog: http://localhost:8025
# - n8n: http://localhost:5678
# - PostgreSQL: localhost:5432
```

### Docker Compose for Local Development (docker-compose.dev.yml)

```yaml
version: '3.8'

services:
  # Next.js app with hot reloading - NOT containerized for development
  # Run directly with pnpm dev for best DX
  
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-soccer}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    logging:
      driver: 'none'  # Reduce log noise

  n8n:
    image: n8nio/n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=false
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_WEBHOOK_URL=http://localhost:5678/
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=${N8N_DB_NAME:-n8n}
      - DB_POSTGRESDB_USER=${POSTGRES_USER:-postgres}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD:-postgres}
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  postgres_data:
  n8n_data:

# Development workflow:
# 1. Start services: docker-compose -f docker-compose.dev.yml up -d
# 2. Run app with hot reload: pnpm dev
# 3. App connects to containerized services
```

### Preview Stack File (docker-stack.preview.yml)

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/${GITHUB_REPOSITORY}:${GITHUB_SHA}
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      DIRECT_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      NEXTAUTH_URL: https://preview.soccer-unify.com
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      EMAIL_SERVER_HOST: mailhog
      EMAIL_SERVER_PORT: 1025
      EMAIL_FROM: noreply@preview.soccer-unify.com
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/preview/uploads:/app/uploads
    deploy:
      replicas: 1
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
    ports:
      - "3001:3000"
    depends_on:
      - postgres
      - redis
      - mailhog

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/preview/postgres:/var/lib/postgresql/data
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/preview/redis:/data
    deploy:
      replicas: 1

  mailhog:
    image: mailhog/mailhog
    ports:
      - "8026:8025"  # Web UI
    deploy:
      replicas: 1

  n8n:
    image: n8nio/n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=n8n-preview.soccer-unify.com
      - N8N_WEBHOOK_URL=https://n8n-preview.soccer-unify.com
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=${N8N_DB_NAME}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/preview/n8n:/home/node/.n8n
    ports:
      - "5679:5678"

networks:
  default:
    driver: overlay
    attachable: true
```

### Production Stack File (docker-stack.prod.yml)

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/${GITHUB_REPOSITORY}:${VERSION}
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      DIRECT_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      REDIS_URL: redis://redis:6379
      NEXTAUTH_URL: ${APP_URL}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET}
      EMAIL_SERVER_HOST: ${SMTP_HOST}
      EMAIL_SERVER_PORT: ${SMTP_PORT}
      EMAIL_SERVER_USER: ${SMTP_USER}
      EMAIL_SERVER_PASSWORD: ${SMTP_PASSWORD}
      EMAIL_FROM: ${EMAIL_FROM}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/prod/uploads:/app/uploads
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/prod/postgres:/var/lib/postgresql/data
      - /mnt/truenas/docker_volumes/project-unity/prod/backups:/backups
    deploy:
      placement:
        constraints:
          - node.role == manager

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/prod/redis:/data
    deploy:
      replicas: 1

  n8n:
    image: n8nio/n8n
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=${N8N_HOST}
      - N8N_WEBHOOK_URL=${N8N_WEBHOOK_URL}
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_DATABASE=${N8N_DB_NAME}
      - DB_POSTGRESDB_USER=${POSTGRES_USER}
      - DB_POSTGRESDB_PASSWORD=${POSTGRES_PASSWORD}
    volumes:
      - /mnt/truenas/docker_volumes/project-unity/prod/n8n:/home/node/.n8n
    ports:
      - "5678:5678"

networks:
  default:
    driver: overlay
    attachable: true
```

## Cost Optimization for MVP

### Infrastructure Costs (Monthly)
- **Home Lab Power:** ~$10-20 (depends on hardware)
- **Internet Upgrade:** $0 (if existing plan sufficient)
- **Cloudflare Zero Trust:** Free tier
- **GitHub Actions:** Free tier (2,000 minutes/month)
- **GitHub Container Registry:** Free tier
- **Domain Name:** ~$12/year ($1/month)

### Service Costs (Monthly)
- **OpenAI API:** ~$20-50 (usage-based)
- **SMTP Service:** $0-10 (for production emails)
- **Monitoring:** $0 (self-hosted Prometheus/Grafana)
- **Backups:** $0 (local storage)

**Total Estimated Monthly Cost: $30-80** (mostly OpenAI API usage)

### Cost Comparison
- **Traditional Cloud Hosting:** $200-500/month
- **Our Home Lab Solution:** $30-80/month
- **Savings:** 75-90% reduction in hosting costs

## Conclusion

This architecture represents a pragmatic approach to MVP development, prioritizing cost-effectiveness and complete control while maintaining professional-grade capabilities. By self-hosting in a home lab environment, we achieve:

### Key Benefits

1. **90% Cost Reduction:** From $200-500/month to $30-80/month
2. **Complete Control:** No vendor lock-in, full data ownership
3. **Professional Infrastructure:** Enterprise patterns at indie scale
4. **Learning Opportunity:** Deep understanding of entire stack
5. **Smooth Scaling Path:** Container-based architecture ready for cloud

### Architectural Strengths

1. **Docker Everywhere:** Consistent environments from dev to prod
2. **GitOps Workflow:** Everything tracked, versioned, and automated
3. **Security First:** Zero Trust tunnels, no exposed ports
4. **Type Safety:** tRPC ensures end-to-end type safety
5. **AI Integration:** n8n provides flexible agent orchestration

### Trade-offs Accepted

1. **Home Internet Dependency:** Mitigated by Cloudflare caching
2. **Manual Scaling Initially:** Acceptable for MVP validation
3. **Self-Managed Backups:** Automated but requires monitoring
4. **Single Point of Failure:** Home lab (mitigated by quick cloud migration path)

### Success Metrics

- **Development Velocity:** Ship features faster with familiar tools
- **User Experience:** Professional performance on budget infrastructure
- **Financial Efficiency:** Validate product before cloud investment
- **Technical Debt:** Minimal - using industry-standard patterns

This architecture proves that modern web applications don't require expensive cloud infrastructure to deliver professional results. By leveraging containerization, smart proxying, and efficient resource usage, we can build and validate products at a fraction of traditional costs.

When success demands scaling, every component is ready for cloud migration. Until then, we operate lean, learn fast, and maintain complete control over our destiny.