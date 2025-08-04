# Sprint Change Proposal: Infrastructure Pivot to Self-Hosted Docker Swarm

**Date**: 2025-08-03  
**Author**: Development Team  
**Change Type**: Major Infrastructure Pivot  

## Analysis Summary

**Issue**: Major architectural pivot from cloud-based infrastructure (Vercel + Supabase) to self-hosted Docker Swarm in homelab with Portainer orchestration and Cloudflare Zero Trust.

**Impact**: 
- All authentication code using Supabase must be replaced with Magic Links
- All GitHub Actions workflows targeting Vercel must be updated for Docker/Portainer
- Missing Docker configurations and deployment scripts need to be created
- Database remains PostgreSQL but moves from Supabase to self-hosted containers

**Rationale for Chosen Path**: Direct adjustment approach preserves existing UI components and business logic while swapping infrastructure layer. This minimizes wasted work and allows incremental migration.

## Specific Proposed Edits

### 1. GitHub Actions Updates

**File: `.github/workflows/ci.yml`**
- Remove all Vercel deployment steps
- Add Docker build and push to ghcr.io
- Add Tailscale setup for secure homelab access
- Update deployment to use Portainer API instead of Vercel

**File: `.github/workflows/deploy-preview.yml`**
- Delete this file entirely (preview deployment handled in main CI workflow)

**File: `.github/workflows/test.yml`**
- Update to test against Docker containers instead of cloud services

### 2. Docker Configuration Files

**New File: `Dockerfile`**
- Multi-stage build: deps → builder → tester → runner
- Prisma generation in build stage
- Health check endpoint
- Non-root user for security

**New File: `docker-compose.dev.yml`**
- PostgreSQL, Redis, MailHog, n8n services
- Volumes for persistent data
- Health checks for all services

**New File: `docker-stack.preview.yml`**
- Swarm deployment configuration for preview environment
- NFS volumes on TrueNAS
- Single replica for preview

**New File: `docker-stack.prod.yml`**
- Production Swarm configuration
- 3 replicas for high availability
- Production SMTP instead of MailHog

### 3. Authentication System Updates

**Delete Files:**
- `apps/web/src/lib/supabase/server.ts`
- `apps/web/src/lib/supabase/client.ts`
- `apps/web/src/lib/supabase/middleware.ts`

**New File: `apps/web/src/lib/auth/magic-link.ts`**
- Token generation and storage
- Email sending integration
- Token verification logic

**Update File: `apps/web/src/lib/auth/actions.ts`**
- Replace all Supabase auth calls with Magic Link functions
- Update session management to use JWT cookies
- Simplify registration flow

**Update File: `apps/web/src/middleware.ts`**
- Replace Supabase session checks with JWT verification
- Update protected route logic

### 4. Database Schema Updates

**File: `apps/web/prisma/schema.prisma`**
Add MagicLink model for authentication tokens

### 5. User Story Updates

**File: `docs/stories/sprint-1/AUTH-001-user-registration.md`**
- Update technical details to use Magic Links
- Remove Supabase-specific implementation
- Update acceptance criteria for email-based flow

**File: `docs/stories/sprint-1/TECH-003-cicd-pipeline.md`**
- Complete rewrite for Docker/Portainer deployment
- Add Tailscale setup instructions
- Update secrets list for new infrastructure

**File: `docs/stories/sprint-1/TECH-004-external-services-setup.md`**
- Remove Supabase setup
- Add Docker Swarm setup
- Add Portainer configuration
- Add Cloudflare Zero Trust setup

### 6. Environment Configuration

Update `.env.example` to remove Supabase variables and add Docker-specific configuration

### 7. Package Updates

**File: `apps/web/package.json`**
- Remove: `@supabase/supabase-js`, `@supabase/ssr`
- Add: `jsonwebtoken`, `@types/jsonwebtoken`, `nodemailer`, `@types/nodemailer`

## Next Steps

### Immediate Actions:
1. Create new feature branch for infrastructure migration
2. Implement Docker configurations
3. Update GitHub Actions workflows
4. Implement Magic Link authentication

### Testing Strategy:
- Test Docker builds locally
- Verify Tailscale connection to homelab
- Test Portainer API deployment
- Verify Magic Link email flow

### Migration Order:
1. Docker setup first (can coexist)
2. GitHub Actions next (test on feature branch)
3. Authentication last (breaking change)

## Agent Handoff Plan

This change primarily requires:
- **Dev Agent**: Implement the proposed code changes
- **DevOps Agent**: Configure Tailscale, Portainer, and deployment scripts
- **Test Agent**: Update test suites for new infrastructure

No fundamental replanning needed - this is an implementation detail change that preserves business requirements.

## Approval Status

- [ ] User Approved
- [ ] Implementation Started
- [ ] Testing Complete
- [ ] Migration Complete