# High Level Architecture

## Technical Summary

The Youth Soccer AI Platform employs a cost-effective self-hosted architecture designed for MVP deployment in a home lab environment. The system uses Next.js as a full-stack framework, containerized with Docker and orchestrated via Docker Swarm. All environments (local, preview, production) run on self-hosted infrastructure with PostgreSQL in Docker containers, eliminating cloud database costs during the MVP phase.

For AI capabilities, we utilize n8n as our agent orchestration platform, enabling visual workflow design for our five specialized AI agents (Coach Winston, Scout Emma, Physio Alex, Motivator Sam, and Analyst Jordan). These agents communicate through n8n workflows, calling OpenAI's GPT-4 and other services, with results stored in our PostgreSQL database.

**MVP Architecture Philosophy:** Self-host everything possible to validate the product before incurring cloud costs. The architecture is designed to be easily migrated to cloud providers once the product proves successful.

## Platform and Infrastructure Choice

**Platform:** Docker Swarm (Container Orchestration) + Cloudflare Zero Trust (SSL & Routing)
**Key Services:** 
- Docker Swarm (Container orchestration in home lab)
- PostgreSQL (Containerized database for all environments)
- n8n (AI Agent Workflows - containerized)
- Cloudflare Zero Trust (SSL tunnels and domain routing)
- GitHub Container Registry (Image storage)
- Portainer (Container management API)
- MailHog/SMTP (Email services - containerized)

**Deployment Infrastructure:** 
- Primary: Home lab with Docker Swarm cluster
- Access: Cloudflare Zero Trust tunnels for public access
- CI/CD: GitHub Actions → Docker build → ghcr.io → Portainer API deployment
- Secure Connection: Tailscale for GitHub to home lab communication

**Future Scale Path:** When ready to scale, the containerized architecture allows easy migration to any cloud provider (AWS ECS, Google Cloud Run, Azure Container Instances) with minimal changes

## Repository Structure

**Structure:** Monorepo
**Monorepo Tool:** Turborepo (optimized build caching and parallel execution)
**Package Organization:** 
- Apps: web (Next.js full-stack)
- Packages: shared (types), ui (components), db (Prisma schema)

## High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[Progressive Web App<br/>Next.js Client]
        Mobile[Mobile Browser<br/>PWA]
    end
    
    subgraph "Cloudflare Zero Trust"
        CF[Cloudflare Tunnel<br/>SSL + Routing]
    end
    
    subgraph "Home Lab Infrastructure"
        subgraph "Docker Swarm Cluster"
            subgraph "Application Stack"
                App1[Next.js App<br/>Container 1]
                App2[Next.js App<br/>Container 2]
                AppN[Next.js App<br/>Container N]
            end
            
            subgraph "Data Layer"
                PG[(PostgreSQL<br/>Primary)]
                Redis[(Redis<br/>Cache)]
                MailHog[MailHog<br/>Email Service]
            end
            
            subgraph "AI Platform"
                n8n[n8n Workflow<br/>Engine]
                subgraph "AI Agents"
                    Winston[Coach Winston]
                    Emma[Scout Emma]
                    Alex[Physio Alex]
                    Sam[Motivator Sam]
                    Jordan[Analyst Jordan]
                end
            end
        end
        
        Portainer[Portainer<br/>Management API]
    end
    
    subgraph "External Services"
        GPT[OpenAI GPT-4<br/>API]
        YT[YouTube API]
        SMTP[External SMTP<br/>(Production Only)]
    end
    
    subgraph "CI/CD Pipeline"
        GH[GitHub Actions]
        GHCR[GitHub Container<br/>Registry]
        TS[Tailscale<br/>Secure Tunnel]
    end
    
    PWA --> CF
    Mobile --> CF
    CF --> App1
    CF --> App2
    CF --> AppN
    
    App1 --> PG
    App2 --> PG
    AppN --> PG
    App1 --> Redis
    App1 --> n8n
    
    n8n --> Winston
    n8n --> Emma
    n8n --> Alex
    n8n --> Sam
    n8n --> Jordan
    
    Winston --> GPT
    n8n --> PG
    n8n --> YT
    n8n --> MailHog
    
    GH --> GHCR
    GH --> TS
    TS --> Portainer
```

## Architectural Patterns

- **Containerized Everything:** All services run in Docker containers - _Rationale:_ Consistent environments, easy deployment, simple scaling
- **Self-Hosted MVP:** Complete control over infrastructure during validation phase - _Rationale:_ Zero cloud costs until product-market fit is proven
- **Docker Swarm Orchestration:** Simple container orchestration - _Rationale:_ Easier than Kubernetes for small deployments, built into Docker
- **Multi-Stage Docker Builds:** Testing integrated into build process - _Rationale:_ Catch issues before deployment, ensures quality
- **NextAuth Email Authentication:** Email-based passwordless auth via NextAuth - _Rationale:_ Industry-standard authentication with email provider, automatic session management
- **PostgreSQL for All Environments:** Consistent database across dev/preview/prod - _Rationale:_ Eliminates environment-specific bugs, simple backup strategy
- **Cloudflare Zero Trust:** Secure public access to home lab - _Rationale:_ Enterprise-grade security without complexity
- **GitOps Deployment:** GitHub Actions drives all deployments - _Rationale:_ Version-controlled, auditable, automated deployments
- **Offline-First PWA:** Service workers with background sync - _Rationale:_ Critical for coaches using app on fields without reliable internet
