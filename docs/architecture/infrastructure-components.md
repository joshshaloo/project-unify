# Infrastructure Components

## Docker Swarm Cluster

**Responsibility:** Container orchestration and service management
**Key Features:**
- Multi-node cluster support (single node for MVP)
- Service scaling and load balancing
- Rolling updates with zero downtime
- Health check monitoring
- Secret management
- Network isolation between services

## NFS Volume Structure

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

## Cloudflare Zero Trust Tunnels

**Responsibility:** Secure public access to home lab services
**Key Features:**
- No exposed ports on home network
- Built-in DDoS protection
- SSL certificates managed by Cloudflare
- Multiple domain support
- Access policies and authentication rules

## Portainer Management

**Responsibility:** Container deployment and management API
**Key Features:**
- RESTful API for deployments
- Stack (docker-compose) management
- Service monitoring and logs
- Volume and network management
- Webhook support for GitOps
