# Technology Stack Reference

## Core Technologies

### Frontend
- **Language:** TypeScript 5.3+
- **Framework:** Next.js 14.2+ (App Router)
- **UI Library:** React 18+
- **Styling:** Tailwind CSS 3.4+
- **Components:** Radix UI 1.0+
- **State Management:** Zustand 4.5+ (client), React Query 5.0+ (server)
- **Build Tool:** Vite 5.0+ / Turbopack (via Next.js)

### Backend  
- **Language:** TypeScript 5.3+
- **Runtime:** Node.js 18+ on AWS Lambda
- **API Layer:** tRPC 11.0+
- **ORM:** Prisma 5.0+
- **Queue:** AWS SQS
- **Serverless:** SST 2.0+

### Database & Storage
- **Primary DB:** PostgreSQL 15+ (via Supabase)
- **Cache:** Redis (Upstash) 7.2+
- **File Storage:** AWS S3
- **Vector DB:** Pinecone
- **CDN:** CloudFront + Vercel Edge

### Authentication & Security
- **Auth Provider:** Supabase Auth 2.0+
- **Token Management:** JWT (httpOnly cookies + memory)
- **Encryption:** TLS 1.3, AES-256 for sensitive data

### AI & ML Services
- **Primary AI:** OpenAI GPT-4 (session planning)
- **Secondary AI:** AWS Bedrock Claude (video analysis)
- **Embeddings:** OpenAI text-embedding-3
- **RAG Pipeline:** LangChain + Pinecone

### External Services
- **Video Search:** YouTube Data API v3
- **Email:** SendGrid
- **Push Notifications:** Firebase Cloud Messaging
- **Analytics:** Mixpanel + Vercel Analytics
- **Error Tracking:** Sentry
- **Monitoring:** CloudWatch + Vercel

### Development Tools
- **Monorepo:** Turborepo
- **Package Manager:** pnpm 8.0+
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions
- **IaC:** SST (Serverless Stack)

## Version Control

All versions listed are minimum supported. Always use latest stable versions within major version constraints.

## Quick Start Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build for production
pnpm build

# Deploy
pnpm deploy
```

## Environment Requirements

### Development
- Node.js 18.17+
- pnpm 8.0+
- Docker (for local Postgres/Redis)

### Production  
- Vercel account (frontend)
- AWS account (backend)
- Supabase project
- API keys for all external services