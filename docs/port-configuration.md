# Port Configuration

## Overview

All services are deployed to a Docker Swarm cluster with specific port mappings to avoid conflicts.

## Port Mappings

### Production Environment

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| App | 3010 | 3000 | Production Next.js application |
| n8n | 5680 | 5678 | Production n8n workflow automation |
| PostgreSQL | - | 5432 | Internal only (no host port) |
| Redis | - | 6379 | Internal only (no host port) |

### Preview Environment

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| App | 3011 | 3000 | Preview Next.js application (used for all PRs) |
| n8n | 5681 | 5678 | Preview n8n workflow automation |
| MailHog | 8125 | 8025 | Email testing interface (Web UI) |
| PostgreSQL | - | 5432 | Internal only (no host port) |
| Redis | - | 6379 | Internal only (no host port) |

## Access URLs

### Production
- App: https://soccer-unify.com (via Cloudflare → Traefik → port 3010)
- n8n: https://n8n.soccer-unify.com (via Cloudflare → Traefik → port 5680)

### Preview
- App: https://preview.soccer-unify.com (via Cloudflare → Traefik → port 3011)
- n8n: https://n8n-preview.soccer-unify.com (via Cloudflare → Traefik → port 5681)
- MailHog: Accessed directly via port 8125 (internal use only)

## PR Deployments

All pull requests deploy to the shared preview environment:
- PRs update the preview stack with their specific image tag
- Only one PR can be tested at a time in the preview environment
- The preview URL remains constant: https://preview.soccer-unify.com

## Internal Services

PostgreSQL and Redis are only accessible within the Docker network and do not expose host ports for security reasons.

## Notes

- All external access is routed through Cloudflare Zero Trust
- Traefik handles internal routing based on hostnames
- The port numbers are chosen to avoid conflicts with existing services
- Previous port conflicts:
  - 3001 was already in use (now using 3010/3011)
  - Standard n8n port 5678 avoided (using 5680/5681)