# TECH-001: Set up monorepo structure

**Type:** Technical Foundation  
**Points:** 5  
**Priority:** P0 (Blocker)  
**Dependencies:** None  

## Description
Initialize the monorepo structure using Turborepo to support the frontend (Next.js), backend (API), and shared packages. This establishes the foundation for all subsequent development.

## Acceptance Criteria
- [ ] Turborepo initialized with proper configuration
- [ ] Three main workspaces created:
  - [ ] `apps/web` - Next.js 14 app with App Router
  - [ ] `apps/api` - tRPC API server
  - [ ] `packages/shared` - Shared types and utilities
- [ ] Package dependencies properly configured
- [ ] Build commands working across all workspaces
- [ ] Development scripts (`pnpm dev`) start all services
- [ ] TypeScript paths configured for clean imports
- [ ] ESLint and Prettier configured consistently
- [ ] Git hooks set up with Husky
- [ ] README with setup instructions

## Technical Details

### Monorepo Structure
```
project-unify/
├── apps/
│   ├── web/          # Next.js PWA
│   └── api/          # tRPC backend
├── packages/
│   ├── shared/       # Shared types/utils
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configs
├── docs/             # Documentation
├── turbo.json        # Turborepo config
├── package.json      # Root package
└── pnpm-workspace.yaml
```

### Key Configurations

**turbo.json:**
```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"]
    }
  }
}
```

**Root package.json scripts:**
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "clean": "turbo run clean"
  }
}
```

## Implementation Steps
1. Initialize pnpm workspace
2. Install Turborepo
3. Create app workspaces with templates
4. Set up shared packages
5. Configure TypeScript paths
6. Add development tooling
7. Set up git hooks
8. Test full build pipeline

## Testing
- Run `pnpm install` - should install all dependencies
- Run `pnpm dev` - should start both web and API
- Run `pnpm build` - should build all packages
- Import from `@soccer/shared` should work
- Git commit should trigger linting

## Notes
- Use pnpm for package management (faster, more efficient)
- Configure Turborepo remote caching later
- Ensure Node 18+ requirement is documented
- Set up VS Code workspace settings