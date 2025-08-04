# Tech Stack

| Category | Technology | Version | Purpose | MVP Rationale |
|----------|------------|---------|---------|---------------|
| Language | TypeScript | 5.3+ | Type-safe development | Shared types across full stack |
| Framework | Next.js | 14.2+ | Full-stack React framework | Containerized for consistent deployment |
| UI Library | Radix UI + Tailwind | Latest | Accessible components + utility CSS | Rapid development with accessibility built-in |
| State Management | Zustand + React Query | Latest | Client state + server cache | Simple, lightweight, perfect for MVP |
| API Layer | tRPC | 11.0+ | Type-safe API | Runs inside Next.js API routes |
| Database | PostgreSQL | 15+ | Primary data storage | Self-hosted in Docker, full control |
| ORM | Prisma | 5.0+ | Database toolkit | Type-safe queries, migrations |
| Cache | Redis | 7+ | In-memory cache | Self-hosted in Docker container |
| File Storage | Local Volume | N/A | Media storage | Docker volumes, S3-compatible later |
| Authentication | NextAuth | 5.0+ | Passwordless auth | Industry-standard with email provider |
| AI Orchestration | n8n | Latest | Visual workflow automation | Self-hosted in Docker container |
| AI | OpenAI API | Latest | GPT-4 access | Called via n8n workflows |
| Email | MailHog (dev) / SMTP | Latest | Email service | MailHog for dev/preview, SMTP for prod |
| Testing | Vitest + Playwright | Latest | Unit/E2E testing | Fast, modern testing |
| Container | Docker | 24+ | Containerization | Consistent environments |
| Orchestration | Docker Swarm | Built-in | Container orchestration | Simple clustering solution |
| CI/CD | GitHub Actions | Latest | Automation | Build, test, and deploy pipeline |
| Tunneling | Cloudflare Zero Trust | Latest | Secure access | SSL and public routing |
| Deployment | Portainer | 2.19+ | Container management | API-driven deployments |
| Monitoring | Prometheus + Grafana | Latest | Metrics & visualization | Self-hosted monitoring stack |
