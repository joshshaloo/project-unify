# Deployment Guide

## Overview

The project uses a streamlined deployment pipeline that:
- Validates code using the same commands developers use locally
- Builds Docker containers and pushes to GitHub Container Registry
- Deploys to homelab infrastructure via Portainer API
- Provides public access through Cloudflare Tunnel

## Architecture

### Container Registry
- **Registry**: GitHub Container Registry (ghcr.io)
- **Image**: `ghcr.io/joshshaloo/soccer/project-unify`
- **Tags**:
  - `latest` - Production (main branch)
  - `develop-{sha}` - Develop branch builds
  - `pr-{number}-{sha}` - Pull request builds

### Environments

1. **Production** (`main` branch)
   - URL: https://app.clubomatic.ai
   - Stack: `soccer-prod`
   - Port: 3010
   
2. **Preview** (`develop` branch + all PRs)
   - URL: https://preview.clubomatic.ai
   - Stack: `soccer-preview`
   - Port: 3011
   - Note: Shared environment for all PRs

### Infrastructure

- **Hosting**: Docker Swarm on homelab server (172.20.0.22)
- **Public Access**: Cloudflare Tunnel (no exposed ports)
- **Container Management**: Portainer
- **GitHub Connection**: Tailscale VPN

## Deployment Flow

### Automatic Deployment

1. **Push to GitHub** → Triggers GitHub Actions
2. **Validation** → `make validate` runs all checks
3. **Build & Push** → `make build` and `make push`
4. **Deploy** → `make deploy-preview` or `make deploy-prod`
5. **Access** → Via Cloudflare Tunnel URLs

### Manual Deployment

```bash
# Deploy specific version to preview
make deploy-preview TAG=develop-abc123

# Deploy to production (requires confirmation)
make deploy-prod TAG=v1.2.3
```

## Required GitHub Secrets

Only minimal secrets in GitHub (configured in Settings → Secrets):

```yaml
# Portainer Access
PORTAINER_API_KEY    # From Portainer user settings
PORTAINER_HOST       # https://portainer.homelab.internal:9443

# Tailscale VPN
TS_OAUTH_CLIENT_ID   # From Tailscale admin console
TS_OAUTH_SECRET      # From Tailscale admin console
```

All application secrets (database passwords, API keys) are configured in Portainer stack environment variables.

## Local Development

Developers use the same commands as CI/CD:

```bash
# Start local environment
make dev

# Run all CI checks before pushing
make validate

# View available commands
make help
```

## Cloudflare Tunnel Configuration

Public URLs are routed through Cloudflare Tunnel:

| Service | Public URL | Internal Target |
|---------|------------|-----------------|
| Production App | https://app.clubomatic.ai | http://172.20.0.22:3010 |
| Production n8n | https://n8n.clubomatic.ai | http://172.20.0.22:5680 |
| Preview App | https://preview.clubomatic.ai | http://172.20.0.22:3011 |
| Preview n8n | https://preview-n8n.clubomatic.ai | http://172.20.0.22:5681 |

## Troubleshooting

### Build Failures
```bash
# Test locally with same command CI uses
make validate

# Check Docker build logs
docker build --no-cache .
```

### Deployment Issues
```bash
# Check if Tailscale is connected
tailscale status

# Verify Portainer API is accessible
curl -H "X-API-Key: $PORTAINER_API_KEY" $PORTAINER_HOST/api/status

# Check deployed image tag
docker service ls
docker service ps soccer-preview_app
```

### Access Problems
- Verify Cloudflare Tunnel is active in Cloudflare dashboard
- Check Docker container is running: `docker ps`
- Review container logs: `docker logs <container-id>`

## Security Considerations

1. **No Exposed Ports** - All access through Cloudflare Tunnel
2. **Secrets in Portainer** - Not in code or GitHub
3. **Private Registry** - Images in GHCR are private by default
4. **VPN for Management** - Tailscale required for deployments

## Rollback Procedure

To rollback to a previous version:

```bash
# Find previous image tags
docker images | grep ghcr.io/joshshaloo/soccer/project-unify

# Deploy specific version
make deploy-preview TAG=previous-tag
# or
make deploy-prod TAG=previous-tag
```

## Monitoring

- **Container Logs**: Available in Portainer UI
- **Health Checks**: Built into Docker services
- **Uptime**: Monitored via Cloudflare
- **Resource Usage**: Visible in Portainer dashboard