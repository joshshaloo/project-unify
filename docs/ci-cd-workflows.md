# CI/CD Workflows Documentation

## Overview

The project uses GitHub Actions for CI/CD with a simplified approach where all workflows use the same Make commands that developers use locally. This ensures consistency between local development and CI/CD.

### Key Principles
- **Single Source of Truth**: Makefile defines all commands
- **Developer-CI Parity**: Same commands work locally and in CI
- **Docker-Based Validation**: All checks run in Docker for consistency

## Workflows

### 1. Main Branch CI/CD (`ci.yml`)

**Triggers:** Push to `main` or `develop` branches

**Process:**
1. **Validate** - Runs `make validate` which uses Docker multi-stage build to:
   - Install dependencies
   - Generate Prisma types
   - Run linting
   - Run type checking
   - Run unit tests
   - Run integration tests

2. **Build & Push** - Creates production image:
   - Tags: `latest` (main), `develop-SHA` (develop)
   - Runs `make build` and `make push`

3. **Deploy** - Updates appropriate environment:
   - `develop` → Preview (https://preview.clubomatic.ai)
   - `main` → Production (https://app.clubomatic.ai)
   - Uses `make deploy-preview` or `make deploy-prod`

4. **E2E Tests** - Validates deployment:
   - Runs Playwright tests against deployed environment
   - Uploads test results as artifacts

### 2. Pull Request Pipeline (`pr.yml`)

**Triggers:** Pull request events (opened, synchronize, reopened, closed)

**Process:**
1. **Validate** - Runs `make validate` for all checks
2. **Build & Push** - Tags as `pr-NUMBER-SHA`
3. **Deploy Preview** - Updates shared preview environment
4. **Test Preview** - Runs E2E tests
5. **Update Status** - Posts results to PR

**Preview URL:** https://preview.clubomatic.ai (shared for all PRs)

## Required GitHub Secrets

Only minimal secrets needed in GitHub:

### Essential Secrets
- `PORTAINER_API_KEY` - For deployment API calls
- `PORTAINER_HOST` - Portainer API endpoint
- `TS_OAUTH_CLIENT_ID` - Tailscale authentication
- `TS_OAUTH_SECRET` - Tailscale authentication

### Application Secrets
All application secrets (database passwords, API keys, etc.) are configured in Portainer stack environment variables, not in GitHub. This follows security best practices.

## Local Commands

Developers use the same commands that CI uses:

```bash
# Daily development
make dev        # Start local environment
make logs       # View logs
make test       # Run tests in Docker

# Before pushing
make validate   # Run all CI checks locally

# Manual deployment (usually automatic)
make deploy-preview TAG=develop-abc123
make deploy-prod TAG=v1.2.3
```

## Image Tagging Strategy

Images are tagged with specific identifiers for traceability:

| Branch/Event | Tag Format | Example |
|--------------|------------|---------|
| main | latest | `ghcr.io/joshshaloo/soccer/project-unify:latest` |
| develop | develop-SHA | `ghcr.io/joshshaloo/soccer/project-unify:develop-abc123` |
| PR | pr-NUMBER-SHA | `ghcr.io/joshshaloo/soccer/project-unify:pr-42-def456` |
| feature | branch-SHA | `ghcr.io/joshshaloo/soccer/project-unify:feat-auth-ghi789` |

## Deployment Architecture

### Infrastructure
- **Hosting**: Docker Swarm on home lab
- **Access**: Cloudflare Tunnel (no exposed ports)
- **Orchestration**: Portainer for stack management
- **Connectivity**: Tailscale VPN for GitHub-to-homelab

### Deployment Flow
1. GitHub Actions builds and validates
2. Image pushed to GitHub Container Registry
3. Portainer API called with specific image tag
4. Docker Swarm pulls and deploys new image
5. Cloudflare Tunnel provides public access

## Branch Protection

Recommended settings for `main` branch:

- ✅ Require pull request before merging
- ✅ Require status checks to pass:
  - `build-and-validate`
  - `test-pr-preview`
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Dismiss stale PR approvals

## Troubleshooting

### Common Issues

**Validation fails locally but passes in CI**
- Ensure you're using `make validate` not running commands directly
- Check Docker is running and up to date

**Deployment fails**
- Verify Tailscale connection is active
- Check Portainer API key hasn't expired
- Ensure image tag was pushed successfully

**E2E tests fail**
- Check preview URL is accessible
- Review Playwright screenshots in artifacts
- Verify database migrations ran

### Useful Commands

```bash
# Check GitHub Actions status
gh run list
gh run view <run-id>

# Test locally exactly as CI does
make validate

# Check what image tags exist
docker images | grep ghcr.io/joshshaloo

# Manual deployment (if needed)
make deploy-preview TAG=specific-tag
```

## Performance Optimizations

1. **Docker Layer Caching** - GitHub Actions cache speeds rebuilds
2. **Concurrent Validation** - Tests run in parallel where possible
3. **Smart Concurrency** - Old PR builds cancelled when updated
4. **Shared Preview** - One environment for all PRs saves resources

## Security Notes

- GitHub only has deployment keys, not application secrets
- All sensitive configuration in Portainer
- Images are private by default in GHCR
- Tailscale provides secure tunnel without exposed ports