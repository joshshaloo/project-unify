# Bootstrap Checklist

## Completed ✅

### 1. Docker Multi-stage Build
- Implemented validation stages in Dockerfile
- All CI/CD checks run inside Docker
- Fixed Prisma/OpenSSL compatibility issues
- Added proper Prisma migration support

### 2. Makefile Simplification
- Reduced from 50+ commands to essentials
- Made Makefile the single UI for developers
- Added bootstrap commands for initial deployment
- All GitHub workflows use make commands

### 3. Infrastructure Updates
- Updated all references from Traefik to Cloudflare Tunnel
- Changed domain from soccer-unify.com to clubomatic.ai
- Exposed PostgreSQL ports for Tailnet access
- Added n8n integration support

### 4. Docker Secrets Implementation
- Replaced environment variables with Docker secrets
- Created bootstrap script to generate secrets
- Updated stack files to use external secrets
- Added docker-entrypoint.sh for secret loading

### 5. Deployment Automation
- Created Python script for Portainer API integration
- Implemented bootstrap vs deploy pattern
- Added automatic image building/pushing
- Fixed stack update API calls

### 6. Documentation
- Updated CLAUDE.md with make workflow
- Removed all direct pnpm references
- Added bootstrap instructions
- Documented all URLs and ports

## Testing Status ⚠️

- Unit tests: 18 failing (pre-existing, out of scope)
- Docker build: ✅ Working
- Bootstrap command: ✅ Working
- Deploy command: ✅ Working
- Service startup: ✅ Fixed Prisma issues

## Remaining Tasks 📋

### 1. GitHub Configuration
- [ ] Set up GitHub Container Registry permissions
- [ ] Configure repository secrets:
  - DOCKER_USERNAME
  - DOCKER_PASSWORD
  - PORTAINER_API_KEY
  - PORTAINER_HOST
- [ ] Set up branch protection rules

### 2. Portainer Configuration
- [ ] Update environment variables in Portainer UI
- [ ] Replace CHANGE-ME placeholders with real values
- [ ] Configure SMTP settings for production
- [ ] Set up monitoring/alerts

### 3. CI/CD Pipeline Testing
- [ ] Create a PR to test the full workflow
- [ ] Verify preview deployment works
- [ ] Test production deployment (with caution)
- [ ] Validate rollback procedures

### 4. Documentation
- [ ] Create runbook for common operations
- [ ] Document secret rotation process
- [ ] Add troubleshooting guide
- [ ] Update team onboarding docs

## Quick Reference

### Bootstrap New Environment
```bash
make bootstrap-preview  # Create preview stack
make bootstrap-prod     # Create production stack
```

### Deploy Updates
```bash
make build             # Build Docker image
make push              # Push to registry
make deploy-preview TAG=abc123  # Deploy to preview
make deploy-prod TAG=v1.2.3     # Deploy to production
```

### Local Development
```bash
make dev               # Start local environment
make validate          # Run all CI checks
make test-local        # Run tests locally
```

### Debugging
```bash
make logs s=app        # View service logs
make shell s=app       # Enter container
make status            # Check service status
```