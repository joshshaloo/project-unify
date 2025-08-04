# Project Unify - Youth Soccer AI Platform

> Empowering youth soccer coaches with AI-driven training plans

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- pnpm 8.0.0 or higher
- Docker (for local development)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/project-unify.git
cd project-unify

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env.local

# Start development servers
pnpm dev
```

## 📁 Project Structure

```
project-unify/
├── apps/
│   ├── web/          # Next.js PWA frontend
│   └── api/          # tRPC API backend
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configurations
├── docs/             # Project documentation
└── turbo.json        # Turborepo configuration
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: tRPC, Prisma, Supabase
- **Database**: PostgreSQL (via Supabase)
- **AI**: OpenAI GPT-4
- **Infrastructure**: Docker, Docker Swarm, Portainer
- **Monorepo**: Turborepo, pnpm

## 📜 Available Scripts

```bash
# Development
pnpm dev              # Start all services
pnpm dev:web          # Start frontend only
pnpm dev:api          # Start backend only

# Build
pnpm build            # Build all packages
pnpm typecheck        # Run TypeScript checks
pnpm lint             # Run ESLint
pnpm test             # Run tests

# Database
pnpm db:migrate       # Run migrations
pnpm db:seed          # Seed database
pnpm db:studio        # Open Prisma Studio
```

## 🚢 Deployment

### Preview Deployments

Every pull request triggers:
1. Docker image build and push to GitHub Container Registry
2. Automatic preview deployment via Portainer API
3. E2E tests run against the preview environment

### Production Deployment

Merges to `main` branch trigger automatic production deployments via GitHub Actions and Portainer.

## 📖 Documentation

Detailed documentation is available in the `/docs` directory:

- [Project Brief](./docs/project-brief.md)
- [Product Requirements](./docs/prd.md)
- [Architecture](./docs/architecture.md)
- [Frontend Specification](./docs/front-end-spec.md)

## 🤝 Contributing

1. Create a feature branch from `develop`
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

Proprietary - All rights reserved