# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Youth Soccer AI Platform - A Next.js full-stack application that empowers youth soccer coaches with AI-driven training plans. The project uses a monorepo structure with Turborepo and is deployed using Docker containers orchestrated by Docker Swarm and managed via Portainer.

## Developer Workflow - ALWAYS USE MAKE COMMANDS

The Makefile is the single UI for all developer interactions. Never run pnpm, docker, or other commands directly.

### Daily Development
```bash
# Start everything locally (Docker + all services)
make dev

# View logs
make logs                # All logs
make logs s=web         # Specific service logs

# Stop everything
make stop

# Enter container shell
make shell              # Default to web container
make shell s=postgres   # Specific service

# Connect to database
make db
```

### Before Pushing Code
```bash
# ALWAYS run this before committing - runs same checks as CI
make validate

# This runs in Docker:
# - Dependency installation
# - Prisma generation  
# - Linting
# - Type checking
# - Unit tests
# - Integration tests
# - Production build
```

### Testing
```bash
# Run tests in Docker (matches CI exactly)
make test

# Run tests locally on host (faster during development)
make test-local
```

### Deployment

#### First Time Setup (Bootstrap)
```bash
# Create initial stacks in Portainer
make bootstrap-preview
make bootstrap-prod

# After bootstrap:
# 1. Log into Portainer
# 2. Update all environment variables
# 3. Remove CHANGE-ME placeholders
```

#### Regular Deployments
```bash
# Build and push image
make build              # Builds with automatic tag
make push               # Pushes to ghcr.io

# Deploy specific versions
make deploy-preview TAG=develop-abc123
make deploy-prod TAG=v1.2.3    # Requires confirmation
```

### Utility Commands
```bash
# Clean up Docker resources
make clean

# Login to GitHub Container Registry
make docker-login

# Check running services
make status

# Run database migrations
make migrate

# Seed database
make seed
```

## Architecture & Infrastructure

### Deployment Architecture
- **Hosting**: Docker Swarm on homelab (172.20.0.22)
- **Public Access**: Cloudflare Tunnel → Docker host ports
- **Container Registry**: GitHub Container Registry (ghcr.io)
- **Orchestration**: Portainer for stack management
- **CI/CD Connection**: Tailscale VPN for GitHub → homelab

### URLs and Ports

#### Production (https://app.clubomatic.ai)
- App: Port 3010
- n8n: Port 5680 (https://n8n.clubomatic.ai)
- PostgreSQL: Port 5434 (Tailnet only)

#### Preview (https://preview.clubomatic.ai)
- App: Port 3011
- n8n: Port 5681 (https://preview-n8n.clubomatic.ai)
- PostgreSQL: Port 5435 (Tailnet only)
- MailHog: Port 8125 (Tailnet only)

#### Local Development
- App: Port 3001 (hot reload enabled)
- PostgreSQL: Port 5433
- MailHog: Port 8025
- n8n: Port 5678

### Database Access (Tailnet Only)
```bash
# Connect to preview database
psql -h 172.20.0.22 -p 5435 -U postgres soccer

# Connect to production database
psql -h 172.20.0.22 -p 5434 -U postgres soccer
```

### Key Architectural Patterns

1. **Single Dockerfile**: Root `/Dockerfile` with multi-stage build
   - All validation happens in Docker
   - Ensures local matches CI/CD exactly

2. **Makefile as UI**: All commands go through make
   - Developers never need to know Docker/pnpm details
   - Same commands work locally and in CI

3. **Image Tagging Strategy**:
   - `latest`: Production (main branch)
   - `develop-SHA`: Develop branch
   - `pr-NUMBER-SHA`: Pull requests
   - `feature-SHA`: Feature branches

4. **Environment Separation**:
   - Local: docker-compose.dev.yml
   - Preview/Prod: docker-stack.*.yml via Portainer

### Critical Files & Patterns

**CI/CD Configuration**:
- `/.github/workflows/ci.yml` - Main branch deployments
- `/.github/workflows/pr.yml` - PR validation and preview
- All workflows use make commands

**Docker Setup**:
- `/Dockerfile` - Multi-stage build with validation
- `/docker-compose.dev.yml` - Local development
- `/docker-stack.preview.yml` - Preview deployments
- `/docker-stack.prod.yml` - Production deployments

**Developer Interface**:
- `/Makefile` - All commands (simplified to essentials)
- Type `make help` to see available commands

### Development Workflow

1. **Start Work**:
   ```bash
   git checkout -b feature/your-feature
   make dev
   ```

2. **During Development**:
   ```bash
   make logs s=web      # Check logs
   make shell           # Debug in container
   make test-local      # Quick test runs
   ```

3. **Before Committing**:
   ```bash
   make validate        # Run all CI checks
   git add -A
   git commit -m "feat: your feature"
   git push
   ```

4. **PR Process**:
   - Push creates PR
   - CI runs `make validate`
   - Preview deployed to https://preview.clubomatic.ai
   - E2E tests run automatically

### Common Gotchas

1. **Always use make commands** - Never run docker/pnpm directly
2. **Run `make validate` before pushing** - Catches issues early
3. **Database ports** - Only accessible via Tailnet, not public
4. **Preview environment** - Shared for all PRs
5. **Environment variables** - Set in Portainer, not GitHub

### Debugging Tips

```bash
# Container won't start?
make logs

# Database connection issues?
make status
make db

# Tests failing locally but not in CI?
make test  # Use Docker version like CI

# Need to check what's deployed?
docker service ls
docker service ps soccer-preview_app
```