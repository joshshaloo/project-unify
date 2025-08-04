# Code Standards and Best Practices

## Purpose
This document defines the coding philosophy, standards, and practices that every contributor must follow across all parts of the platform. Our goal is to write **clean, maintainable, and scalable code** that is simple to understand and easy to change.

Inspired by:
- **Sandi Metz** – Practical Object-Oriented Design
- **SOLID** Principles
- **Gang of Four** Design Patterns
- **KISS**, **DRY**, and **YAGNI** principles

---

## Core Philosophy

### ✅ Write Code for Humans
Your future teammates (and your future self) should be able to read, understand, and modify your code without mental gymnastics. Strive for:
- Clarity over cleverness
- Explicit over implicit
- Small, single-purpose functions

> 💡 "If you can't explain what this method does in one sentence, it's doing too much."

---

### ✅ Keep It Simple, Stupid (KISS)
- Prefer simple solutions that do the job
- Avoid premature abstraction — abstract only when duplication has meaning
- Minimize the number of moving parts (classes, interfaces, layers)

---

### ✅ Don't Repeat Yourself (DRY)
- Eliminate duplication across business logic, validation, error handling, and queries
- Use shared builders, factories, and helpers when patterns emerge

---

## TypeScript/Next.js Specific Practices

### 🎯 Component Design
- Keep components small and reusable (one component = one purpose)
- Use custom hooks for shared logic
- Avoid prop drilling with context or composition
- Use clear naming for state variables (e.g., `isLoading`, `hasError`)
- Always type props and state explicitly — avoid `any`
- Maintain consistent folder structure: `components/`, `hooks/`, `lib/`, `utils/`

### 🔧 Server Components vs Client Components
- Use Server Components by default (Next.js App Router)
- Only use Client Components when you need:
  - Event handlers (onClick, onChange, etc.)
  - Browser APIs (localStorage, window, etc.)
  - React hooks (useState, useEffect, etc.)
  - Third-party libraries that use browser APIs

### 📁 Project Structure
```
apps/web/src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Auth group routes
│   ├── (dashboard)/       # Dashboard group routes
│   └── api/               # API routes
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   └── features/         # Feature-specific components
├── lib/                  # Core libraries and utilities
│   ├── supabase/        # Supabase client setup
│   ├── trpc/            # tRPC setup and routers
│   └── prisma.ts        # Prisma client
├── hooks/               # Custom React hooks
└── utils/               # Utility functions
```

### 🛡️ Type Safety
- Use TypeScript strict mode
- Define explicit types for all function parameters and returns
- Use Zod for runtime validation of external data
- Leverage Prisma's generated types for database entities
- Use tRPC for end-to-end type safety between client and server

### 🎨 Styling Guidelines
- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use CSS variables for theme values
- Keep component-specific styles co-located
- Use Radix UI for accessible components

---

## Testing Standards

### 🧪 Testing Pyramid
1. **Unit Tests** (Vitest)
   - Test individual functions and components
   - Mock external dependencies
   - Aim for 80% coverage

2. **Integration Tests** (Vitest)
   - Test API routes and database interactions
   - Use test database with proper cleanup
   - Test authentication flows

3. **E2E Tests** (Playwright)
   - Test critical user journeys
   - Run against preview deployments
   - Focus on happy paths and key error states

### 📝 Test Naming
```typescript
// Good
test('should return user profile when authenticated', async () => {})
test('should throw UnauthorizedError when token is invalid', async () => {})

// Bad
test('test user', async () => {})
test('works', async () => {})
```

---

## Code Formatting & Linting

- **TypeScript**: Prettier + ESLint with Next.js config
- **Import Order**: Use ESLint import sorting
  1. React/Next imports
  2. Third-party imports
  3. Absolute imports (@/)
  4. Relative imports
- All pull requests must pass formatting and linting checks
- No commented-out code in committed files

---

## Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`, `auth-actions.ts`)
- **Components**: PascalCase (`UserProfile`, `SessionCard`)
- **Functions**: camelCase (`getUserProfile`, `validateSession`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase with descriptive names
  ```typescript
  type UserProfile = { ... }
  interface SessionCardProps { ... }
  ```

---

## Security Best Practices

### 🔒 Authentication & Authorization
- Always validate user permissions on the server
- Use Row Level Security (RLS) in Supabase
- Never expose sensitive data in client components
- Validate all user inputs with Zod schemas

### 🛡️ API Security
- Use tRPC procedures with proper auth middleware
- Implement rate limiting for public endpoints
- Sanitize all user-generated content
- Use CSRF protection for mutations

---

## Performance Guidelines

### ⚡ Next.js Optimization
- Use dynamic imports for heavy components
- Implement proper loading states
- Optimize images with Next.js Image component
- Use React.memo sparingly and only when measured
- Leverage ISR/SSG where appropriate

### 📊 Database Performance
- Use proper indexes on frequently queried columns
- Implement pagination for large datasets
- Use Prisma's select to fetch only needed fields
- Batch database operations when possible

---

## Pull Request Standards

### 📋 PR Checklist
- [ ] Descriptive title following conventional commits
- [ ] Links to related issue/story
- [ ] Tests added/updated
- [ ] Documentation updated if needed
- [ ] No console.logs or debugger statements
- [ ] Passes all CI checks

### 💬 PR Description Template
```markdown
## What
Brief description of changes

## Why
Context and reasoning

## How
Technical approach

## Testing
How to verify changes

## Screenshots
(if UI changes)
```

---

## Anti-Patterns to Avoid

❌ **Component Anti-patterns**
- God components (>300 lines)
- Inline styles when Tailwind classes exist
- Direct DOM manipulation
- Uncontrolled form inputs without good reason

❌ **State Management Anti-patterns**
- Storing derived state
- Duplicating server state in client state
- Using useEffect for data fetching (use React Query/tRPC)
- Prop drilling beyond 2-3 levels

❌ **TypeScript Anti-patterns**
- Using `any` type
- Ignoring TypeScript errors with `@ts-ignore`
- Not using discriminated unions for complex types
- Overly complex generic types

---

## Continuous Improvement

- Code reviews must flag violations of these standards
- Refactor opportunistically when touching existing code
- Share learnings in team discussions
- Update this document as patterns emerge
- Measure and optimize based on real performance data