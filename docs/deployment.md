# Deployment Guide

## Overview

The Soccer AI Platform uses a comprehensive CI/CD pipeline that:
- Validates and tests all code changes
- Builds Docker containers for deployment
- Deploys to homelab infrastructure via Portainer
- Manages preview environments for pull requests

## Architecture

### Container Registry
- **Registry**: GitHub Container Registry (ghcr.io)
- **Image**: `ghcr.io/joshshaloo/soccer-project-unify`
- **Tags**:
  - `latest` - Production (main branch)
  - `develop` - Preview environment
  - `pr-{number}` - Pull request previews

### Environments
1. **Production** (`main` branch)
   - URL: https://soccer-unify.com
   - Stack: `soccer-prod`
   
2. **Preview** (`develop` branch)
   - URL: https://preview.soccer-unify.com
   - Stack: `soccer-preview`
   
3. **PR Previews** (pull requests)
   - URL: https://pr-{number}.soccer-unify.homelab.internal
   - Stack: `soccer-pr-{number}`
   - Publicly accessible (no VPN required)

## CI/CD Workflows

### 1. Main CI Pipeline (`ci.yml`)
Triggers on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

Steps:
1. **Validate** - Type check, lint, unit tests, build
2. **Build & Push** - Docker image to ghcr.io (only on push)
3. **Deploy** - To preview/production via Portainer
4. **E2E Tests** - Run against deployed environment

### 2. PR Homelab Deployment (`deploy-pr-homelab.yml`)
Triggers on:
- PR opened/updated/closed

Features:
- Deploys each PR to isolated environment
- Automatic cleanup on PR close
- E2E tests against preview
- Comments deployment status on PR

### 3. Test Suite (`test.yml`)
Comprehensive testing including:
- Unit tests with coverage
- Integration tests
- E2E tests with Playwright
- Build verification

## Required GitHub Secrets

```bash
# Tailscale (for homelab access)
TS_OAUTH_CLIENT_ID
TS_OAUTH_SECRET

# Portainer API
PORTAINER_API_KEY

# Database
DATABASE_URL_PREVIEW
DATABASE_URL_PROD
DIRECT_URL_PREVIEW
DIRECT_URL_PROD

# Services
OPENAI_API_KEY
N8N_WEBHOOK_URL

# URLs
PREVIEW_URL
```

## Setup Instructions

### 1. GitHub Container Registry

Enable GitHub Packages for your repository:
1. Go to Settings > Actions > General
2. Under "Workflow permissions", select "Read and write permissions"
3. Save changes

### 2. Configure Secrets

Add all required secrets to your repository:
1. Go to Settings > Secrets and variables > Actions
2. Add each secret listed above

### 3. Portainer Configuration

Ensure Portainer has:
1. API access enabled (only accessible via Tailscale/VPN)
2. Stacks configured for `soccer-prod` and `soccer-preview`
3. Traefik network available for public routing
4. Proper labels for routing

### 4. Branch Protection

Configure branch protection for `main`:
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["validate", "build-and-push"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  }
}
```

## Deployment Flow

### Feature Development
1. Create feature branch from `main`
2. Push changes - runs validation only
3. Open PR - deploys to `pr-{number}.soccer-unify.homelab.internal`
4. Tests run automatically against PR preview
5. Merge to `main` after approval

### Preview Deployment
1. Merge to `develop` branch
2. Automatic deployment to preview environment
3. E2E tests run against preview
4. Manual testing at https://preview.soccer-unify.com

### Production Deployment
1. Merge `develop` to `main`
2. Automatic deployment to production
3. Available at https://soccer-unify.com

## Monitoring

### Build Status
- Check GitHub Actions tab for workflow runs
- PR comments show deployment status
- Failed builds block merging

### Container Images
- View at: https://github.com/joshshaloo/soccer/project-unify/pkgs/container/soccer-project-unify
- Automatic cleanup after 30 days

### Application Health
- Health endpoint: `/api/health`
- Portainer shows container status
- Traefik handles routing and SSL

## Troubleshooting

### Failed Deployments
1. Check GitHub Actions logs
2. Verify secrets are set correctly
3. Ensure Tailscale connection is active
4. Check Portainer API accessibility

### PR Preview Issues
1. Check Traefik routing rules
2. Ensure stack deployed successfully in Portainer
3. Verify DNS resolution for pr-{number}.soccer-unify.homelab.internal
4. Review container logs in Portainer (requires VPN access)

### Build Failures
1. Run tests locally: `pnpm test`
2. Check type errors: `pnpm typecheck`
3. Verify Docker builds: `docker build .`
4. Review workflow logs for specific errors

## Local Development

### Running CI Checks Locally
```bash
# Run all validation steps
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# Build Docker image
docker build -t soccer-web:local .

# Run container
docker run -p 3000:3000 soccer-web:local
```

### Testing Workflows
Use [act](https://github.com/nektos/act) to test workflows locally:
```bash
act -j validate
act -j build-and-push --secret-file .env.secrets
```