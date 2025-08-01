# Local Development Setup Guide

## Prerequisites

### Required Software
```bash
# Check versions
node --version    # Required: 18.17.0 or higher
pnpm --version    # Required: 8.0.0 or higher  
git --version     # Required: 2.0.0 or higher
docker --version  # Required: 20.0.0 or higher
```

### Install Prerequisites

#### macOS
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node@18

# Install pnpm
npm install -g pnpm

# Install Docker Desktop
brew install --cask docker
```

#### Windows (WSL2)
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Docker Desktop for Windows
# Download from https://www.docker.com/products/docker-desktop
```

#### Linux
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose
```

## Repository Setup

### 1. Clone Repository
```bash
git clone https://github.com/your-org/project-unify.git
cd project-unify
```

### 2. Install Dependencies
```bash
# Install all workspace dependencies
pnpm install

# Install git hooks
pnpm prepare
```

### 3. Environment Configuration

#### Create Environment Files
```bash
# Copy example files
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local
```

#### Configure Local Environment

**.env.local (root)**
```bash
# Not needed for local dev
```

**apps/web/.env.local**
```bash
# Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: External APIs for full functionality
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-key
```

**apps/api/.env**
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soccer_platform
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/soccer_platform

# Redis
REDIS_URL=redis://localhost:6379

# Supabase
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_KEY=your-service-role-key

# AI Services (required for AI features)
OPENAI_API_KEY=sk-...

# Optional services
SENDGRID_API_KEY=SG...
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

## Local Services Setup

### 1. Start Docker Services
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Initialize Database
```bash
# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed

# Open Prisma Studio (optional)
pnpm db:studio
```

### 3. Start Supabase (Optional)
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Get local keys
supabase status
```

## Development Workflow

### Start Development Servers
```bash
# Start all services (recommended)
pnpm dev

# Or start individually
pnpm dev:web    # Frontend only (http://localhost:3000)
pnpm dev:api    # Backend only (http://localhost:3001)
```

### Common Development Tasks

#### Add New Package
```bash
# Add to specific workspace
pnpm add package-name --filter @soccer/web
pnpm add package-name --filter @soccer/api

# Add to shared packages
pnpm add package-name --filter @soccer/shared

# Add dev dependency
pnpm add -D package-name --filter @soccer/web
```

#### Run Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific workspace tests
pnpm test --filter @soccer/web

# Run E2E tests
pnpm test:e2e
```

#### Type Checking
```bash
# Check all workspaces
pnpm typecheck

# Check specific workspace
pnpm typecheck --filter @soccer/web
```

#### Linting
```bash
# Lint all code
pnpm lint

# Auto-fix linting issues
pnpm lint:fix
```

#### Database Changes
```bash
# Create new migration
pnpm db:migrate:dev

# Reset database
pnpm db:reset

# View database
pnpm db:studio
```

## Troubleshooting

### Port Conflicts
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps

# Restart services
docker-compose restart

# Check logs
docker-compose logs postgres
```

### Node Module Issues
```bash
# Clear all node_modules
pnpm clean

# Reinstall dependencies
pnpm install

# Clear pnpm cache
pnpm store prune
```

### Build Issues
```bash
# Clear build artifacts
rm -rf apps/web/.next
rm -rf apps/api/dist

# Rebuild
pnpm build
```

## IDE Setup

### VS Code
Install recommended extensions:
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- GitLens

### Settings
`.vscode/settings.json` is included with project-specific settings.

## Next Steps
1. Create test user accounts
2. Explore the codebase structure
3. Review coding standards
4. Join development channels
5. Pick up first ticket