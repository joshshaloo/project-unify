# CI/CD Workflows Documentation

## Overview

The project uses GitHub Actions for CI/CD with two main workflows:

1. **ci.yml** - Handles main branch deployments (main, develop)
2. **pr.yml** - Handles pull request validation, preview deployments, and cleanup

## Workflow Details

### CI/CD - Main Branches (`ci.yml`)

**Triggers:** Push to `main` or `develop` branches

**Jobs:**
1. **build-and-validate** - Docker multi-stage build that:
   - Installs dependencies
   - Generates Prisma types
   - Runs linting
   - Runs type checking
   - Runs unit tests
   - Runs integration tests
   - Builds production image
   - Pushes to GitHub Container Registry

2. **deploy** - Deploys to appropriate environment
   - `develop` → Preview environment
   - `main` → Production environment
   - Uses Portainer API via Tailscale VPN

3. **e2e-tests** - Runs E2E tests against deployed environment
   - Waits for deployment to be ready
   - Uses Playwright for browser automation

### PR Pipeline (`pr.yml`)

**Triggers:** Pull request events (opened, synchronize, reopened, closed)

**Jobs:**
1. **build-and-validate** - Docker multi-stage build that:
   - Runs all validation steps (lint, typecheck, tests)
   - Builds and validates PR image
   - Pushes to GitHub Container Registry with PR tags

2. **deploy-pr-preview** - Updates shared preview environment
   - URL: `https://preview.soccer-unify.com`
   - Updates preview stack with PR image
   - Posts preview URL as PR comment

3. **test-pr-preview** - Runs E2E tests against preview
   - Tests the actual deployed preview
   - Uploads test results as artifacts

4. **update-pr-status** - Aggregates all check results
   - Posts summary comment on PR
   - Shows pass/fail status for each check

5. **cleanup-pr-preview** - Notes PR closure
   - Preview environment remains available
   - Posts closure notification

## Required Secrets

Configure these in GitHub repository settings:

- `PORTAINER_API_KEY` - API key for Portainer access
- `PORTAINER_HOST` - Portainer API URL (e.g., https://portainer.homelab.internal:9443)
- `TS_OAUTH_CLIENT_ID` - Tailscale OAuth client ID
- `TS_OAUTH_SECRET` - Tailscale OAuth secret
- `DATABASE_URL_PREVIEW` - Preview database connection string
- `NEXTAUTH_SECRET` - NextAuth.js secret
- `OPENAI_API_KEY` - OpenAI API key
- `N8N_WEBHOOK_URL` - n8n webhook URL
- `EMAIL_SERVER_HOST` - Email server host
- `EMAIL_SERVER_PORT` - Email server port
- `EMAIL_FROM` - From email address

## Branch Protection

Recommended branch protection rules for `main`:

- Require PR before merging
- Require status checks to pass:
  - `validate`
  - `test-pr-preview`
- Require branches to be up to date
- Require conversation resolution
- Dismiss stale PR approvals

## Optimization Features

1. **Change Detection** - Only runs tests for changed code
2. **Docker Layer Caching** - Uses GitHub Actions cache
3. **Concurrent Jobs** - Validation runs in parallel
4. **PR Concurrency** - Cancels old runs when PR is updated
5. **Conditional Steps** - Skips unnecessary work

## Troubleshooting

### Common Issues

1. **Docker build fails**
   - Check Dockerfile syntax
   - Verify all dependencies are available
   - Check Docker build logs in GitHub Actions

2. **Deployment fails**
   - Verify Tailscale connection
   - Check Portainer API key
   - Ensure stack names are unique

3. **E2E tests fail**
   - Check preview URL accessibility
   - Verify test selectors match current UI
   - Review Playwright trace files

### Debugging Commands

```bash
# Check workflow runs
gh run list

# View specific run details
gh run view <run-id>

# Download artifacts
gh run download <run-id>

# Re-run failed jobs
gh run rerun <run-id> --failed
```

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Test PR workflow
act pull_request -W .github/workflows/pr.yml

# Test CI workflow
act push -W .github/workflows/ci.yml
```