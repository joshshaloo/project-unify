# Port Configuration

## Overview

All services are deployed to a Docker Swarm cluster with specific port mappings to avoid conflicts. External access is provided through Cloudflare Tunnel, not Traefik.

## Port Mappings

### Production Environment

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| App | 3010 | 3000 | Production Next.js application |
| n8n | 5680 | 5678 | Production n8n workflow automation |
| PostgreSQL | 5434 | 5432 | Production database (Tailnet access only) |
| Redis | - | 6379 | Internal only (no host port) |

### Preview Environment

| Service | Host Port | Container Port | Description |
|---------|-----------|----------------|-------------|
| App | 3011 | 3000 | Preview Next.js application (used for all PRs) |
| n8n | 5681 | 5678 | Preview n8n workflow automation |
| MailHog | 8125 | 8025 | Email testing interface (Tailnet access only) |
| PostgreSQL | 5435 | 5432 | Preview database (Tailnet access only) |
| Redis | - | 6379 | Internal only (no host port) |

## Access URLs via Cloudflare Tunnel

### Production
- App: https://app.clubomatic.ai (→ 172.20.0.22:3010)
- n8n: https://n8n.clubomatic.ai (→ 172.20.0.22:5680)

### Preview
- App: https://preview.clubomatic.ai (→ 172.20.0.22:3011)
- n8n: https://preview-n8n.clubomatic.ai (→ 172.20.0.22:5681)

## Cloudflare Tunnel Configuration

The Cloudflare Tunnel connects directly to the Docker host ports:

| Public Hostname | Type | Service |
|-----------------|------|---------|
| app.clubomatic.ai | HTTP | http://172.20.0.22:3010 |
| n8n.clubomatic.ai | HTTP | http://172.20.0.22:5680 |
| preview.clubomatic.ai | HTTP | http://172.20.0.22:3011 |
| preview-n8n.clubomatic.ai | HTTP | http://172.20.0.22:5681 |

## PR Deployments

All pull requests deploy to the shared preview environment:
- PRs update the preview stack with their specific image tag
- Only one PR can be tested at a time in the preview environment
- The preview URL remains constant: https://preview.clubomatic.ai

## Internal Services

PostgreSQL and Redis are only accessible within the Docker network and do not expose host ports for security reasons.

## Local Development

| Service | Port | Description |
|---------|------|-------------|
| App | 3001 | Next.js dev server with hot reload |
| PostgreSQL | 5433 | Development database |
| Redis | 6379 | Development cache |
| MailHog SMTP | 1025 | Development email server |
| MailHog UI | 8025 | Development email interface |
| n8n | 5678 | Development workflow automation |

## Notes

- All external access is routed through Cloudflare Tunnel (no Traefik)
- The Docker host IP is 172.20.0.22
- Port numbers are chosen to avoid conflicts with existing services
- Previous domain was soccer-unify.com, now migrated to clubomatic.ai