# Youth Soccer AI Platform Fullstack Architecture Document

This document outlines the complete fullstack architecture for Youth Soccer AI Platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## Starter Template or Existing Project

N/A - Greenfield project

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-08-01 | 1.0 | Initial architecture document | Alex, Design Architect |

## High Level Architecture

### Technical Summary

The Youth Soccer AI Platform employs a modern serverless architecture with a Next.js-based Progressive Web App frontend and AWS Lambda-powered backend services. The frontend and backend are tightly integrated through tRPC for type-safe API communication, with real-time features powered by WebSockets. Core AI services leverage OpenAI's GPT-4 for session planning and AWS Bedrock for video content analysis. The platform is deployed on Vercel (frontend) and AWS (backend), utilizing Supabase for authentication, PostgreSQL for data persistence, and S3 for media storage. This architecture achieves the PRD goals of rapid coach planning, seamless multi-role experiences, and offline capability while maintaining a low operational cost suitable for the $5000 MVP budget.

### Platform and Infrastructure Choice

**Platform:** Vercel + AWS Hybrid
**Key Services:** Vercel (Frontend hosting, Edge Functions), AWS Lambda (Backend compute), Supabase (Auth + Realtime), PostgreSQL (Database), S3 (Media storage), CloudFront (CDN), OpenAI API (AI Planning), AWS Bedrock (Video analysis)
**Deployment Host and Regions:** Primary: US-East-1 (Virginia), Edge: Global via Vercel Edge Network

### Repository Structure

**Structure:** Monorepo
**Monorepo Tool:** Turborepo (optimized build caching, ideal for Vercel deployment)
**Package Organization:** Apps (web, api), Packages (shared types, UI components, business logic), organized by feature modules for better scalability

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        PWA[Progressive Web App<br/>Next.js + React]
        Mobile[Mobile Browser<br/>PWA]
    end
    
    subgraph "Edge Layer"
        CDN[CloudFront CDN]
        VEdge[Vercel Edge Network]
    end
    
    subgraph "API Gateway"
        TRPC[tRPC API Layer]
        WS[WebSocket Server<br/>Realtime Updates]
    end
    
    subgraph "Backend Services"
        Auth[Supabase Auth]
        Lambda[AWS Lambda Functions]
        Queue[SQS Message Queue]
    end
    
    subgraph "AI Services"
        GPT[OpenAI GPT-4<br/>Session Planning]
        Bedrock[AWS Bedrock<br/>Video Analysis]
        RAG[RAG Pipeline<br/>Curriculum Context]
    end
    
    subgraph "Data Layer"
        PG[(PostgreSQL<br/>Multi-tenant)]
        Redis[(Redis Cache)]
        S3[S3 Media Storage]
        Vector[(Pinecone<br/>Vector DB)]
    end
    
    subgraph "External Services"
        YT[YouTube API<br/>Video Search]
        Email[SendGrid Email]
        Analytics[Mixpanel Analytics]
    end
    
    PWA --> VEdge
    Mobile --> VEdge
    VEdge --> CDN
    CDN --> TRPC
    TRPC --> Lambda
    TRPC --> WS
    Lambda --> Auth
    Lambda --> Queue
    Queue --> GPT
    Queue --> Bedrock
    Lambda --> PG
    Lambda --> Redis
    Lambda --> S3
    GPT --> RAG
    RAG --> Vector
    Lambda --> YT
    Lambda --> Email
    PWA --> Analytics
```

### Architectural Patterns

- **Jamstack Architecture:** Static generation with dynamic API routes for optimal performance and SEO - _Rationale:_ Reduces server load, improves performance for global users, perfect for content-heavy coaching materials
- **Serverless Backend:** AWS Lambda functions for all backend logic - _Rationale:_ Cost-effective for MVP budget, scales automatically, no server maintenance required
- **Event-Driven Processing:** SQS queues for AI processing pipelines - _Rationale:_ Prevents timeout issues with long-running AI tasks, enables retry logic, improves user experience
- **Component-Based UI:** Atomic design with React Server Components where possible - _Rationale:_ Maximizes reusability across multiple user personas, reduces bundle size
- **Repository Pattern:** Abstract all data access behind repository interfaces - _Rationale:_ Enables easy testing, future database migrations, and clean architecture
- **Backend for Frontend (BFF):** tRPC layer tailored for PWA needs - _Rationale:_ Type safety across stack, optimized data fetching, reduced over-fetching
- **Multi-Tenant Isolation:** Row-level security with tenant context - _Rationale:_ Secure data isolation for clubs while maintaining single codebase
- **Offline-First PWA:** Service workers with background sync - _Rationale:_ Critical for coaches using app on fields without reliable internet
- **CQRS Lite:** Separate read/write patterns for analytics vs operations - _Rationale:_ Optimizes performance for DOC dashboards while maintaining fast coach workflows

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend development | Prevents runtime errors, improves IDE support, essential for large codebase |
| Frontend Framework | Next.js | 14.2+ | React framework with SSR/SSG | PWA support, optimal performance, great DX, Vercel optimization |
| UI Component Library | Radix UI + Tailwind | Radix 1.0+, Tailwind 3.4+ | Accessible components + utility CSS | Radix provides unstyled accessible components, Tailwind enables rapid styling |
| State Management | Zustand + React Query | Zustand 4.5+, RQ 5.0+ | Client state + server cache | Lightweight alternative to Redux, React Query handles cache invalidation |
| Backend Language | TypeScript | 5.3+ | Type-safe backend development | Share types with frontend, consistent developer experience |
| Backend Framework | tRPC + AWS Lambda | tRPC 11.0+ | Type-safe API + serverless compute | End-to-end type safety, automatic API client generation |
| API Style | tRPC (RPC) | 11.0+ | Type-safe remote procedure calls | Superior DX for monorepo, no API documentation needed |
| Database | PostgreSQL (Supabase) | 15+ | Primary data storage | ACID compliance, row-level security, multi-tenant support |
| Cache | Redis (Upstash) | 7.2+ | Session cache + rate limiting | Serverless Redis for Lambda compatibility, low latency |
| File Storage | AWS S3 | - | Media and document storage | Cost-effective, integrates with CloudFront CDN |
| Authentication | Supabase Auth | 2.0+ | User authentication + authorization | Built-in multi-factor auth, social logins, JWT tokens |
| Frontend Testing | Vitest + React Testing Library | Vitest 1.0+, RTL 14+ | Unit + component testing | Faster than Jest, native ESM support, familiar API |
| Backend Testing | Vitest | 1.0+ | API + service testing | Consistent with frontend, fast execution |
| E2E Testing | Playwright | 1.40+ | End-to-end testing | Cross-browser support, reliable, fast execution |
| Build Tool | Vite | 5.0+ | Frontend bundling | Instant HMR, optimized builds, ESM-first |
| Bundler | Turbopack (via Next.js) | Beta | Next.js bundling | Faster builds than Webpack, Rust-based performance |
| IaC Tool | SST (Serverless Stack) | 2.0+ | Infrastructure as code | Designed for serverless, great local development |
| CI/CD | GitHub Actions | - | Continuous integration/deployment | Free for public repos, great Vercel integration |
| Monitoring | Sentry + Vercel Analytics | Latest | Error tracking + performance | Comprehensive error tracking, real user monitoring |
| Logging | AWS CloudWatch | - | Centralized logging | Native Lambda integration, cost-effective |
| CSS Framework | Tailwind CSS | 3.4+ | Utility-first CSS | Rapid development, consistent design system, small bundle size |

## Data Models

### User

**Purpose:** Core user entity representing all platform users across different roles (DOC, Coach, Player, Parent)

**Key Attributes:**
- id: UUID - Unique identifier from Supabase Auth
- email: string - Primary email address
- firstName: string - User's first name
- lastName: string - User's last name
- avatarUrl: string | null - Profile picture URL
- phoneNumber: string | null - Contact number
- birthDate: Date | null - For age verification (players)
- createdAt: Date - Account creation timestamp
- updatedAt: Date - Last profile update
- onboardingCompleted: boolean - Track onboarding status
- preferences: JSON - User-specific settings

#### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phoneNumber?: string;
  birthDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  onboardingCompleted: boolean;
  preferences: UserPreferences;
}

interface UserPreferences {
  language: 'en' | 'es';
  timezone: string;
  notifications: NotificationSettings;
}
```

#### Relationships
- Has many UserClubRoles (multi-role support)
- Has many PlayerProfiles (parents can have multiple children)
- Has many Sessions (as creator)
- Has many TeamMemberships

### Club

**Purpose:** Represents a youth soccer club organization with its own curriculum and teams

**Key Attributes:**
- id: UUID - Unique club identifier
- name: string - Club name
- slug: string - URL-friendly identifier
- logoUrl: string | null - Club logo
- primaryColor: string - Brand color (hex)
- secondaryColor: string - Secondary brand color
- timezone: string - Club's default timezone
- settings: JSON - Club-wide configuration
- subscriptionStatus: enum - Active, Trial, Suspended
- subscriptionTier: enum - Starter, Professional, Enterprise
- createdAt: Date - Club creation date
- updatedAt: Date - Last update timestamp

#### TypeScript Interface
```typescript
interface Club {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  timezone: string;
  settings: ClubSettings;
  subscriptionStatus: 'active' | 'trial' | 'suspended';
  subscriptionTier: 'starter' | 'professional' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
}

interface ClubSettings {
  ageGroups: string[];
  seasonStructure: 'fall-spring' | 'year-round';
  approvalWorkflow: ApprovalSettings;
}
```

#### Relationships
- Has many Teams
- Has many UserClubRoles
- Has one Curriculum
- Has many Seasons

### UserClubRole

**Purpose:** Junction table supporting multiple roles per user per club (e.g., DOC at one club, parent at another)

**Key Attributes:**
- id: UUID - Unique identifier
- userId: UUID - Reference to User
- clubId: UUID - Reference to Club
- role: enum - DOC, HeadCoach, AssistantCoach, Parent, Player
- isPrimary: boolean - User's primary role for UI adaptation
- permissions: JSON - Role-specific permissions
- createdAt: Date - Role assignment date
- expiresAt: Date | null - For temporary roles

#### TypeScript Interface
```typescript
interface UserClubRole {
  id: string;
  userId: string;
  clubId: string;
  role: 'doc' | 'head_coach' | 'assistant_coach' | 'parent' | 'player';
  isPrimary: boolean;
  permissions: RolePermissions;
  createdAt: Date;
  expiresAt?: Date;
}

interface RolePermissions {
  canEditCurriculum: boolean;
  canApproveSessionPlans: boolean;
  canViewAnalytics: boolean;
  canManageTeams: boolean;
  canAssignHomework: boolean;
}
```

#### Relationships
- Belongs to User
- Belongs to Club
- Determines access to Teams via TeamMembership

### Team

**Purpose:** Represents a specific team within a club (e.g., U12 Boys, U8 Girls)

**Key Attributes:**
- id: UUID - Unique identifier
- clubId: UUID - Parent club reference
- name: string - Team name
- ageGroup: string - U6, U8, U10, etc.
- gender: enum - Boys, Girls, Coed
- skillLevel: enum - Recreational, Competitive, Elite
- seasonId: UUID - Current season reference
- isActive: boolean - Currently active team
- settings: JSON - Team-specific settings

#### TypeScript Interface
```typescript
interface Team {
  id: string;
  clubId: string;
  name: string;
  ageGroup: string;
  gender: 'boys' | 'girls' | 'coed';
  skillLevel: 'recreational' | 'competitive' | 'elite';
  seasonId: string;
  isActive: boolean;
  settings: TeamSettings;
}

interface TeamSettings {
  trainingDays: string[];
  sessionDuration: number; // minutes
  fieldType: 'full' | 'half' | 'quarter';
}
```

#### Relationships
- Belongs to Club
- Belongs to Season
- Has many TeamMemberships
- Has many SessionPlans
- Has many Evaluations

### SessionPlan

**Purpose:** AI-generated or coach-created training session plan

**Key Attributes:**
- id: UUID - Unique identifier
- teamId: UUID - Target team
- createdBy: UUID - Coach who created/requested
- sessionDate: Date - Scheduled session date
- duration: number - Session length in minutes
- theme: string - Session focus/theme
- objectives: string[] - Learning objectives
- drills: JSON[] - Structured drill data
- aiGenerated: boolean - Created by AI or manual
- approvalStatus: enum - Draft, PendingApproval, Approved, Rejected
- approvedBy: UUID | null - Approver reference
- approvalNotes: string | null - Approval feedback
- sharedWithPlayers: boolean - Visibility to players
- sharedWithParents: boolean - Visibility to parents

#### TypeScript Interface
```typescript
interface SessionPlan {
  id: string;
  teamId: string;
  createdBy: string;
  sessionDate: Date;
  duration: number;
  theme: string;
  objectives: string[];
  drills: Drill[];
  aiGenerated: boolean;
  approvalStatus: 'draft' | 'pending_approval' | 'approved' | 'rejected';
  approvedBy?: string;
  approvalNotes?: string;
  sharedWithPlayers: boolean;
  sharedWithParents: boolean;
}

interface Drill {
  id: string;
  name: string;
  duration: number;
  description: string;
  videoUrl?: string;
  diagramUrl?: string;
  coachingPoints: string[];
  equipment: string[];
}
```

#### Relationships
- Belongs to Team
- Belongs to User (creator)
- References CurriculumDrills
- Has many PlayerHomework assignments

### PlayerProfile

**Purpose:** Player-specific information and development tracking

**Key Attributes:**
- id: UUID - Unique identifier
- userId: UUID - Reference to User account
- parentUserId: UUID | null - Parent's user ID
- preferredPosition: string | null - Field position
- dominantFoot: enum | null - Left, Right, Both
- playerNumber: number | null - Jersey number
- medicalNotes: string | null - Encrypted medical info
- developmentGoals: JSON - Current IDP goals

#### TypeScript Interface
```typescript
interface PlayerProfile {
  id: string;
  userId: string;
  parentUserId?: string;
  preferredPosition?: string;
  dominantFoot?: 'left' | 'right' | 'both';
  playerNumber?: number;
  medicalNotes?: string; // encrypted
  developmentGoals: DevelopmentGoal[];
}

interface DevelopmentGoal {
  id: string;
  category: 'technical' | 'tactical' | 'physical' | 'mental';
  goal: string;
  targetDate: Date;
  progress: number; // 0-100
  completed: boolean;
}
```

#### Relationships
- Belongs to User
- Optionally belongs to Parent User
- Has many Evaluations
- Has many PlayerHomework
- Has many QuizResults

### Curriculum

**Purpose:** Club-wide curriculum structure containing philosophy and content

**Key Attributes:**
- id: UUID - Unique identifier
- clubId: UUID - Owning club
- philosophicalPillars: JSON - Core principles
- lastUpdated: Date - Version tracking
- publishedVersion: string - Current version
- draftVersion: string | null - Work in progress

#### TypeScript Interface
```typescript
interface Curriculum {
  id: string;
  clubId: string;
  philosophicalPillars: PhilosophicalPillar[];
  lastUpdated: Date;
  publishedVersion: string;
  draftVersion?: string;
}

interface PhilosophicalPillar {
  id: string;
  name: string;
  description: string;
  keyPrinciples: string[];
  ageGroupAdaptations: Record<string, string>;
}
```

#### Relationships
- Belongs to Club
- Has many CurriculumDrills
- Has many SeasonTemplates
- Has many SessionTemplates

## API Specification

### tRPC Router Definitions

```typescript
// packages/api/src/routers/index.ts
import { t } from '../trpc';
import { authRouter } from './auth';
import { clubRouter } from './club';
import { teamRouter } from './team';
import { sessionRouter } from './session';
import { curriculumRouter } from './curriculum';
import { aiRouter } from './ai';
import { playerRouter } from './player';
import { analyticsRouter } from './analytics';

export const appRouter = t.router({
  auth: authRouter,
  club: clubRouter,
  team: teamRouter,
  session: sessionRouter,
  curriculum: curriculumRouter,
  ai: aiRouter,
  player: playerRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
```

```typescript
// packages/api/src/routers/auth.ts
import { z } from 'zod';
import { t, authedProcedure, publicProcedure } from '../trpc';

export const authRouter = t.router({
  // Get current user with all roles
  me: authedProcedure.query(async ({ ctx }) => {
    const userWithRoles = await ctx.db.user.findUnique({
      where: { id: ctx.user.id },
      include: {
        clubRoles: {
          include: { club: true },
        },
        playerProfiles: true,
      },
    });
    return userWithRoles;
  }),

  // Update user preferences
  updatePreferences: authedProcedure
    .input(z.object({
      language: z.enum(['en', 'es']).optional(),
      timezone: z.string().optional(),
      notifications: z.object({
        email: z.boolean(),
        push: z.boolean(),
        sms: z.boolean(),
      }).partial().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: { preferences: input },
      });
    }),

  // Complete onboarding
  completeOnboarding: authedProcedure
    .input(z.object({
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      phoneNumber: z.string().optional(),
      primaryRole: z.enum(['doc', 'coach', 'parent', 'player']),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.user.id },
        data: {
          ...input,
          onboardingCompleted: true,
        },
      });
    }),
});
```

```typescript
// packages/api/src/routers/session.ts
export const sessionRouter = t.router({
  // Create new session plan
  create: authedProcedure
    .input(z.object({
      teamId: z.string().uuid(),
      sessionDate: z.date(),
      duration: z.number().min(30).max(180),
      theme: z.string().optional(),
      useAI: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check permissions
      const membership = await ctx.db.teamMembership.findFirst({
        where: {
          teamId: input.teamId,
          userId: ctx.user.id,
          role: { in: ['head_coach', 'assistant_coach'] },
        },
      });
      
      if (!membership) throw new TRPCError({ code: 'FORBIDDEN' });

      if (input.useAI) {
        // Queue AI generation
        const plan = await ctx.db.sessionPlan.create({
          data: {
            ...input,
            createdBy: ctx.user.id,
            aiGenerated: true,
            approvalStatus: 'draft',
            drills: [],
          },
        });

        await ctx.queue.send('generate-session-plan', {
          planId: plan.id,
          teamId: input.teamId,
          theme: input.theme,
        });

        return plan;
      }

      // Manual creation
      return ctx.db.sessionPlan.create({
        data: {
          ...input,
          createdBy: ctx.user.id,
          aiGenerated: false,
          approvalStatus: 'draft',
        },
      });
    }),

  // Get session plans for team
  getByTeam: authedProcedure
    .input(z.object({
      teamId: z.string().uuid(),
      status: z.enum(['all', 'draft', 'approved']).optional(),
      limit: z.number().min(1).max(50).default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify access
      const hasAccess = await ctx.permissions.canViewTeam(ctx.user.id, input.teamId);
      if (!hasAccess) throw new TRPCError({ code: 'FORBIDDEN' });

      const where = {
        teamId: input.teamId,
        ...(input.status !== 'all' && {
          approvalStatus: input.status,
        }),
      };

      const plans = await ctx.db.sessionPlan.findMany({
        where,
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { sessionDate: 'desc' },
        include: {
          createdBy: true,
          approvedBy: true,
        },
      });

      let nextCursor: typeof input.cursor | undefined = undefined;
      if (plans.length > input.limit) {
        const nextItem = plans.pop();
        nextCursor = nextItem!.id;
      }

      return {
        items: plans,
        nextCursor,
      };
    }),

  // Submit for approval
  submitForApproval: authedProcedure
    .input(z.object({
      planId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const plan = await ctx.db.sessionPlan.findUnique({
        where: { id: input.planId },
        include: { team: true },
      });

      if (!plan || plan.createdBy !== ctx.user.id) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Check if approval required
      const club = await ctx.db.club.findUnique({
        where: { id: plan.team.clubId },
      });

      const requiresApproval = club?.settings?.approvalWorkflow?.enabled ?? false;

      return ctx.db.sessionPlan.update({
        where: { id: input.planId },
        data: {
          approvalStatus: requiresApproval ? 'pending_approval' : 'approved',
          ...(requiresApproval && {
            submittedAt: new Date(),
          }),
        },
      });
    }),

  // Share with players/parents
  updateSharing: authedProcedure
    .input(z.object({
      planId: z.string().uuid(),
      sharedWithPlayers: z.boolean().optional(),
      sharedWithParents: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership or approval rights
      const plan = await ctx.db.sessionPlan.findUnique({
        where: { id: input.planId },
      });

      if (!plan || (plan.createdBy !== ctx.user.id && !ctx.permissions.canApprove)) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      return ctx.db.sessionPlan.update({
        where: { id: input.planId },
        data: {
          sharedWithPlayers: input.sharedWithPlayers ?? plan.sharedWithPlayers,
          sharedWithParents: input.sharedWithParents ?? plan.sharedWithParents,
        },
      });
    }),
});
```

```typescript
// packages/api/src/routers/ai.ts
export const aiRouter = t.router({
  // Generate session plan
  generateSessionPlan: authedProcedure
    .input(z.object({
      teamId: z.string().uuid(),
      sessionDate: z.date(),
      duration: z.number(),
      theme: z.string().optional(),
      recentPerformance: z.string().optional(),
      focusAreas: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get team and curriculum context
      const team = await ctx.db.team.findUnique({
        where: { id: input.teamId },
        include: {
          club: {
            include: {
              curriculum: true,
            },
          },
        },
      });

      if (!team) throw new TRPCError({ code: 'NOT_FOUND' });

      // Call AI service
      const prompt = buildSessionPrompt({
        curriculum: team.club.curriculum,
        ageGroup: team.ageGroup,
        skillLevel: team.skillLevel,
        theme: input.theme,
        duration: input.duration,
        recentPerformance: input.recentPerformance,
        focusAreas: input.focusAreas,
      });

      const aiResponse = await ctx.ai.generateCompletion({
        prompt,
        model: 'gpt-4-turbo',
        temperature: 0.7,
      });

      // Parse and structure the response
      const drills = await parseAIDrills(aiResponse);
      
      // Find relevant videos for each drill
      const drillsWithVideos = await Promise.all(
        drills.map(async (drill) => {
          const videos = await ctx.youtube.searchVideos({
            query: `youth soccer ${drill.name} ${team.ageGroup}`,
            maxResults: 3,
          });
          
          return {
            ...drill,
            videoUrl: videos[0]?.url,
            alternativeVideos: videos.slice(1),
          };
        })
      );

      return {
        theme: aiResponse.theme,
        objectives: aiResponse.objectives,
        drills: drillsWithVideos,
      };
    }),

  // Chat with AI assistant
  chat: authedProcedure
    .input(z.object({
      message: z.string(),
      context: z.object({
        role: z.enum(['doc', 'coach', 'parent', 'player']),
        teamId: z.string().optional(),
        playerId: z.string().optional(),
      }),
      conversationId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user context
      const userContext = await buildUserContext(ctx.user.id, input.context);
      
      // Retrieve conversation history
      const history = input.conversationId 
        ? await ctx.db.conversation.findUnique({
            where: { id: input.conversationId },
            include: { messages: { take: 10, orderBy: { createdAt: 'desc' } } },
          })
        : null;

      // Build context-aware prompt
      const systemPrompt = buildAssistantPrompt(input.context.role, userContext);
      
      const response = await ctx.ai.chat({
        systemPrompt,
        messages: [
          ...(history?.messages.reverse() ?? []),
          { role: 'user', content: input.message },
        ],
      });

      // Save conversation
      const conversation = await ctx.db.conversation.upsert({
        where: { id: input.conversationId ?? '' },
        create: {
          userId: ctx.user.id,
          messages: {
            create: [
              { role: 'user', content: input.message },
              { role: 'assistant', content: response.content },
            ],
          },
        },
        update: {
          messages: {
            create: [
              { role: 'user', content: input.message },
              { role: 'assistant', content: response.content },
            ],
          },
        },
      });

      return {
        conversationId: conversation.id,
        response: response.content,
      };
    }),
});
```

## Components

### Frontend Components

**Responsibility:** User interface layer providing responsive, accessible, and performant UI components

**Key Interfaces:**
- React components with TypeScript props
- Hooks for state management and API calls
- Context providers for global state

**Dependencies:** React, Next.js, Radix UI, Tailwind CSS, tRPC client

**Technology Stack:** TypeScript, React 18+, Next.js 14+, Radix UI for accessibility, Tailwind for styling

### Authentication Service

**Responsibility:** Handle user authentication, authorization, and session management

**Key Interfaces:**
- Supabase Auth client for login/logout
- JWT token validation
- Role-based access control helpers
- Session refresh logic

**Dependencies:** Supabase Auth, PostgreSQL for user data

**Technology Stack:** Supabase Auth SDK, JWT tokens, Row Level Security policies

### API Gateway (tRPC)

**Responsibility:** Type-safe API layer handling all client-server communication

**Key Interfaces:**
- tRPC routers for each domain
- WebSocket subscriptions for real-time
- Request validation with Zod
- Error handling middleware

**Dependencies:** AWS Lambda, PostgreSQL, Redis cache, External services

**Technology Stack:** tRPC 11+, Zod validation, AWS Lambda, WebSocket API

### AI Planning Engine

**Responsibility:** Generate intelligent session plans based on curriculum and context

**Key Interfaces:**
- Session plan generation API
- Curriculum parsing and indexing
- Video recommendation engine
- Performance analysis integration

**Dependencies:** OpenAI API, YouTube API, Vector database, SQS queue

**Technology Stack:** OpenAI GPT-4, Pinecone vector DB, AWS SQS, TypeScript

### Video Search Service

**Responsibility:** Find and curate relevant soccer training videos from YouTube

**Key Interfaces:**
- YouTube API search wrapper
- Video quality scoring
- Content filtering and validation
- Caching layer for common searches

**Dependencies:** YouTube Data API v3, Redis cache

**Technology Stack:** YouTube API client, Redis for caching, TypeScript

### Analytics Engine

**Responsibility:** Process and aggregate data for DOC dashboards and insights

**Key Interfaces:**
- Real-time metrics collection
- Aggregation pipelines
- Report generation
- Data export APIs

**Dependencies:** PostgreSQL, Redis, S3 for exports

**Technology Stack:** PostgreSQL aggregates, Redis for real-time metrics, AWS Lambda

### Notification Service

**Responsibility:** Handle all platform notifications across email, push, and in-app

**Key Interfaces:**
- Template-based email sending
- Push notification dispatch
- In-app notification storage
- Preference management

**Dependencies:** SendGrid for email, Firebase for push

**Technology Stack:** SendGrid API, Firebase Cloud Messaging, PostgreSQL for preferences

### Media Storage Service

**Responsibility:** Handle file uploads, image optimization, and CDN distribution

**Key Interfaces:**
- Presigned upload URLs
- Image transformation API
- CDN URL generation
- Access control

**Dependencies:** AWS S3, CloudFront CDN

**Technology Stack:** S3 for storage, CloudFront for distribution, Sharp for image processing

### Background Job Processor

**Responsibility:** Handle async operations like AI generation and video processing

**Key Interfaces:**
- Job queue management
- Retry logic
- Progress tracking
- Result callbacks

**Dependencies:** AWS SQS, Lambda functions

**Technology Stack:** SQS for queuing, Lambda for processing, DynamoDB for job status

### Data Access Layer

**Responsibility:** Abstract database operations and enforce multi-tenant isolation

**Key Interfaces:**
- Repository pattern interfaces
- Query builders
- Transaction management
- Row-level security

**Dependencies:** PostgreSQL, Supabase client

**Technology Stack:** Prisma ORM, PostgreSQL, Supabase RLS

### Component Diagrams

```mermaid
C4Container
    title Container Diagram - Youth Soccer AI Platform

    Person(coach, "Coach", "Plans training sessions")
    Person(doc, "DOC", "Manages curriculum")
    Person(player, "Player", "Completes homework")
    Person(parent, "Parent", "Views progress")

    System_Boundary(platform, "Soccer Platform") {
        Container(web, "Web App", "Next.js, React", "Progressive Web App")
        Container(api, "API Gateway", "tRPC, Lambda", "Type-safe API")
        Container(auth, "Auth Service", "Supabase Auth", "Authentication")
        Container(ai, "AI Engine", "GPT-4, Lambda", "Session planning")
        Container(analytics, "Analytics", "PostgreSQL", "Insights & reports")
        Container(media, "Media Service", "S3, CloudFront", "File storage")
        Container(notify, "Notifications", "SendGrid, FCM", "Communications")
        Container(jobs, "Job Queue", "SQS, Lambda", "Async processing")
        
        ContainerDb(db, "Database", "PostgreSQL", "Application data")
        ContainerDb(cache, "Cache", "Redis", "Session cache")
        ContainerDb(vector, "Vector DB", "Pinecone", "Curriculum search")
    }

    System_Ext(openai, "OpenAI", "GPT-4 API")
    System_Ext(youtube, "YouTube", "Video search")
    System_Ext(email, "SendGrid", "Email delivery")

    Rel(coach, web, "Uses", "HTTPS")
    Rel(doc, web, "Uses", "HTTPS")
    Rel(player, web, "Uses", "HTTPS")
    Rel(parent, web, "Uses", "HTTPS")

    Rel(web, api, "Calls", "tRPC/WSS")
    Rel(web, auth, "Authenticates", "JWT")
    Rel(web, media, "Uploads", "Presigned URLs")

    Rel(api, db, "Queries", "SQL")
    Rel(api, cache, "Caches", "Redis protocol")
    Rel(api, jobs, "Queues", "SQS")
    Rel(api, ai, "Invokes", "Internal")
    Rel(api, analytics, "Queries", "Internal")
    Rel(api, notify, "Triggers", "Internal")

    Rel(ai, openai, "Generates", "HTTPS")
    Rel(ai, youtube, "Searches", "HTTPS")
    Rel(ai, vector, "Queries", "HTTPS")

    Rel(notify, email, "Sends", "HTTPS")
    Rel(auth, db, "Stores", "SQL")
    Rel(jobs, ai, "Processes", "Lambda")

    UpdateElementStyle(coach, $color="blue")
    UpdateElementStyle(doc, $color="green")
    UpdateElementStyle(player, $color="orange")
    UpdateElementStyle(parent, $color="purple")
    UpdateElementStyle(web, $color="blue", $icon="react")
    UpdateElementStyle(db, $color="green", $icon="postgresql")
```

## External APIs

### YouTube Data API

- **Purpose:** Search and retrieve soccer training drill videos for AI-generated session plans
- **Documentation:** https://developers.google.com/youtube/v3
- **Base URL(s):** https://www.googleapis.com/youtube/v3
- **Authentication:** API Key authentication with quota management
- **Rate Limits:** 10,000 units per day (search costs 100 units per request)

**Key Endpoints Used:**
- `GET /search` - Search for soccer drill videos by keywords
- `GET /videos` - Get video details including duration and metadata

**Integration Notes:** Cache common searches aggressively. Implement exponential backoff for rate limit handling. Filter results by duration (prefer 2-10 minute drill videos) and view count for quality.

### OpenAI API

- **Purpose:** Power the AI Planning Engine for session generation and chat assistants
- **Documentation:** https://platform.openai.com/docs/api-reference
- **Base URL(s):** https://api.openai.com/v1
- **Authentication:** Bearer token authentication
- **Rate Limits:** 10,000 TPM for GPT-4, 90,000 TPM for GPT-3.5-turbo

**Key Endpoints Used:**
- `POST /chat/completions` - Generate session plans and chat responses
- `POST /embeddings` - Create embeddings for curriculum content

**Integration Notes:** Use GPT-4 for session planning (higher quality), GPT-3.5-turbo for chat (cost-effective). Implement streaming responses for better UX. Cache embeddings in vector database.

### SendGrid Email API

- **Purpose:** Transactional emails for notifications, plan sharing, and system alerts
- **Documentation:** https://docs.sendgrid.com/api-reference
- **Base URL(s):** https://api.sendgrid.com/v3
- **Authentication:** API Key authentication
- **Rate Limits:** 100 emails/second

**Key Endpoints Used:**
- `POST /mail/send` - Send transactional emails
- `POST /mail/batch` - Batch send for team notifications

**Integration Notes:** Use dynamic templates for consistent branding. Implement unsubscribe handling. Track email engagement for analytics. Queue emails during high-volume periods.

### AWS Bedrock API

- **Purpose:** Advanced AI capabilities for video analysis and content understanding
- **Documentation:** https://docs.aws.amazon.com/bedrock/latest/APIReference
- **Base URL(s):** https://bedrock-runtime.{region}.amazonaws.com
- **Authentication:** AWS Signature V4
- **Rate Limits:** Varies by model, typically 10-50 requests/second

**Key Endpoints Used:**
- `POST /model/{modelId}/invoke` - Analyze game footage and training videos
- `POST /model/{modelId}/invoke-stream` - Stream analysis results

**Integration Notes:** Use Claude models for video understanding tasks. Implement cost controls with usage monitoring. Process videos in chunks for large files.

### Firebase Cloud Messaging (FCM)

- **Purpose:** Push notifications to mobile PWA users
- **Documentation:** https://firebase.google.com/docs/cloud-messaging
- **Base URL(s):** https://fcm.googleapis.com/v1
- **Authentication:** OAuth 2.0 service account
- **Rate Limits:** 600k messages/minute per project

**Key Endpoints Used:**
- `POST /projects/{project}/messages:send` - Send push notifications
- `POST /projects/{project}/messages:sendBatch` - Batch notifications

**Integration Notes:** Store FCM tokens securely. Handle token refresh. Implement topic subscriptions for team-wide notifications. Respect user notification preferences.

## Core Workflows

### Coach Creates AI-Generated Session Plan

```mermaid
sequenceDiagram
    participant Coach
    participant WebApp
    participant API
    participant Queue
    participant AI
    participant YouTube
    participant DB
    participant WS as WebSocket

    Coach->>WebApp: Navigate to session planning
    WebApp->>API: session.create({teamId, date, useAI: true})
    API->>API: Validate permissions
    API->>DB: Create draft session plan
    API->>Queue: Queue AI generation job
    API-->>WebApp: Return planId (immediate)
    WebApp->>Coach: Show "Generating..." UI
    
    Note over Queue,AI: Async Processing
    Queue->>AI: Process generation job
    AI->>DB: Get team & curriculum data
    AI->>AI: Build contextual prompt
    AI->>OpenAI: Generate session plan
    OpenAI-->>AI: Return structured plan
    
    loop For each drill
        AI->>YouTube: Search for drill videos
        YouTube-->>AI: Return video results
        AI->>AI: Score and select best video
    end
    
    AI->>DB: Update session plan with drills
    AI->>WS: Notify plan ready
    WS-->>WebApp: Push update
    WebApp->>API: session.getById(planId)
    API->>DB: Fetch complete plan
    API-->>WebApp: Return plan details
    WebApp->>Coach: Display generated plan
    
    Coach->>WebApp: Review and edit
    Coach->>WebApp: Submit for approval
    WebApp->>API: session.submitForApproval(planId)
    API->>DB: Update status
    API-->>WebApp: Confirm submission
```

### Player Completes Homework Assignment

```mermaid
sequenceDiagram
    participant Player
    participant WebApp
    participant API
    participant DB
    participant Analytics

    Player->>WebApp: Open homework section
    WebApp->>API: player.getAssignments()
    API->>DB: Fetch active assignments
    API-->>WebApp: Return assignments list
    WebApp->>Player: Display homework tasks
    
    Player->>WebApp: Select video homework
    WebApp->>WebApp: Load video player
    Player->>WebApp: Watch training video
    WebApp->>Analytics: Track video progress
    
    Player->>WebApp: Complete video
    WebApp->>API: player.completeHomework({id, duration})
    API->>DB: Update completion status
    API->>DB: Update IDP progress
    API-->>WebApp: Confirm completion
    
    WebApp->>Player: Show success message
    WebApp->>API: player.getNextAssignment()
    API-->>WebApp: Return tactical quiz
    
    Player->>WebApp: Take quiz
    WebApp->>API: player.submitQuiz({answers})
    API->>API: Calculate score
    API->>DB: Store quiz results
    API->>DB: Update development metrics
    API-->>WebApp: Return score & feedback
    
    WebApp->>Player: Display results
    WebApp->>WebApp: Update progress UI
```

### DOC Reviews Club-Wide Analytics

```mermaid
sequenceDiagram
    participant DOC
    participant WebApp
    participant API
    participant Analytics
    participant DB
    participant Cache

    DOC->>WebApp: Open analytics dashboard
    WebApp->>API: analytics.getDashboard({clubId})
    
    API->>Cache: Check for cached data
    alt Cache hit
        Cache-->>API: Return cached metrics
    else Cache miss
        API->>Analytics: Request aggregation
        
        par Curriculum Adherence
            Analytics->>DB: Query session plans
            Analytics->>Analytics: Calculate adherence %
        and Coach Engagement
            Analytics->>DB: Query coach activity
            Analytics->>Analytics: Calculate engagement metrics
        and Player Development
            Analytics->>DB: Query player progress
            Analytics->>Analytics: Calculate growth trends
        and Parent Satisfaction
            Analytics->>DB: Query NPS scores
            Analytics->>Analytics: Calculate satisfaction
        end
        
        Analytics-->>API: Return aggregated data
        API->>Cache: Store with TTL
    end
    
    API-->>WebApp: Return dashboard data
    WebApp->>DOC: Display metrics
    
    DOC->>WebApp: Drill down into team
    WebApp->>API: analytics.getTeamDetails({teamId})
    API->>DB: Fetch detailed metrics
    API-->>WebApp: Return team data
    WebApp->>DOC: Show team analytics
    
    DOC->>WebApp: Export report
    WebApp->>API: analytics.generateReport({filters})
    API->>Analytics: Generate PDF report
    API->>S3: Store report file
    API-->>WebApp: Return download URL
    WebApp->>DOC: Download report
```

### Multi-Role User Access Flow

```mermaid
sequenceDiagram
    participant User
    participant WebApp
    participant API
    participant Auth
    participant DB

    User->>WebApp: Login
    WebApp->>Auth: Authenticate
    Auth-->>WebApp: Return JWT token
    
    WebApp->>API: auth.me()
    API->>DB: Get user with all roles
    API-->>WebApp: Return user + roles
    
    Note over WebApp: Determine UI based on roles
    
    alt Has multiple active roles
        WebApp->>User: Show unified dashboard
        User->>WebApp: Click "RSL Academy"
        WebApp->>WebApp: Set context to DOC role
        WebApp->>User: Show DOC interface
        
        User->>WebApp: Click "My U12 Team"
        WebApp->>WebApp: Switch context to Coach
        WebApp->>User: Show coach interface
        
        User->>WebApp: Click "My Child"
        WebApp->>WebApp: Switch context to Parent
        WebApp->>User: Show parent portal
    else Single role
        WebApp->>User: Show role-specific UI
    end
    
    Note over WebApp: No explicit mode switching
    Note over WebApp: Context determines available actions
```

## Database Schema

### PostgreSQL Schema with Multi-Tenant Isolation

```sql
-- Enable Row Level Security
ALTER DATABASE soccer_platform SET row_level_security = on;

-- Users table (managed by Supabase Auth)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(20),
    birth_date DATE,
    onboarding_completed BOOLEAN DEFAULT false,
    preferences JSONB DEFAULT '{"language": "en", "timezone": "UTC", "notifications": {"email": true, "push": true, "sms": false}}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clubs table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#000000',
    secondary_color VARCHAR(7) DEFAULT '#FFFFFF',
    timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',
    settings JSONB DEFAULT '{}',
    subscription_status VARCHAR(20) DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended')),
    subscription_tier VARCHAR(20) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User-Club roles (multi-role support)
CREATE TABLE user_club_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('doc', 'head_coach', 'assistant_coach', 'parent', 'player')),
    is_primary BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, club_id, role)
);

-- Seasons
CREATE TABLE seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teams
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    age_group VARCHAR(10) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('boys', 'girls', 'coed')),
    skill_level VARCHAR(20) CHECK (skill_level IN ('recreational', 'competitive', 'elite')),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team memberships
CREATE TABLE team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('head_coach', 'assistant_coach', 'player')),
    jersey_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id, role)
);

-- Curriculum
CREATE TABLE curriculums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    philosophical_pillars JSONB NOT NULL DEFAULT '[]',
    published_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    draft_version VARCHAR(20),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id)
);

-- Session plans
CREATE TABLE session_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    session_date DATE NOT NULL,
    duration INTEGER NOT NULL CHECK (duration >= 30 AND duration <= 180),
    theme VARCHAR(255),
    objectives TEXT[],
    drills JSONB DEFAULT '[]',
    ai_generated BOOLEAN DEFAULT false,
    approval_status VARCHAR(20) DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending_approval', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approval_notes TEXT,
    shared_with_players BOOLEAN DEFAULT false,
    shared_with_parents BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player profiles
CREATE TABLE player_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_user_id UUID REFERENCES users(id),
    preferred_position VARCHAR(50),
    dominant_foot VARCHAR(10) CHECK (dominant_foot IN ('left', 'right', 'both')),
    player_number INTEGER,
    medical_notes TEXT, -- Will be encrypted at application level
    development_goals JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Player homework assignments
CREATE TABLE player_homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    session_plan_id UUID REFERENCES session_plans(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('video', 'quiz', 'practice')),
    content JSONB NOT NULL,
    assigned_date DATE NOT NULL,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    completion_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Evaluations
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    evaluator_id UUID NOT NULL REFERENCES users(id),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL,
    type VARCHAR(20) CHECK (type IN ('technical', 'tactical', 'physical', 'mental', 'overall')),
    scores JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation messages
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_club_roles_user_id ON user_club_roles(user_id);
CREATE INDEX idx_user_club_roles_club_id ON user_club_roles(club_id);
CREATE INDEX idx_teams_club_id ON teams(club_id);
CREATE INDEX idx_team_memberships_user_id ON team_memberships(user_id);
CREATE INDEX idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX idx_session_plans_team_id ON session_plans(team_id);
CREATE INDEX idx_session_plans_session_date ON session_plans(session_date);
CREATE INDEX idx_player_homework_player_id ON player_homework(player_id);
CREATE INDEX idx_evaluations_player_id ON evaluations(player_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);

-- Row Level Security Policies
-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_club_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_homework ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;

-- Users can see clubs they belong to
CREATE POLICY "Users can view their clubs" ON clubs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_club_roles
            WHERE user_club_roles.club_id = clubs.id
            AND user_club_roles.user_id = auth.uid()
        )
    );

-- Users can see teams in their clubs
CREATE POLICY "Users can view teams in their clubs" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_club_roles
            WHERE user_club_roles.club_id = teams.club_id
            AND user_club_roles.user_id = auth.uid()
        )
    );

-- Session plans visibility based on role and sharing settings
CREATE POLICY "Session plan visibility" ON session_plans
    FOR SELECT USING (
        -- Coaches can see all plans for their teams
        EXISTS (
            SELECT 1 FROM team_memberships tm
            JOIN teams t ON tm.team_id = t.id
            WHERE t.id = session_plans.team_id
            AND tm.user_id = auth.uid()
            AND tm.role IN ('head_coach', 'assistant_coach')
        )
        OR
        -- Players can see shared plans
        (
            session_plans.shared_with_players = true
            AND EXISTS (
                SELECT 1 FROM team_memberships
                WHERE team_memberships.team_id = session_plans.team_id
                AND team_memberships.user_id = auth.uid()
                AND team_memberships.role = 'player'
            )
        )
        OR
        -- Parents can see shared plans for their children
        (
            session_plans.shared_with_parents = true
            AND EXISTS (
                SELECT 1 FROM player_profiles pp
                JOIN team_memberships tm ON pp.user_id = tm.user_id
                WHERE tm.team_id = session_plans.team_id
                AND pp.parent_user_id = auth.uid()
            )
        )
    );

-- Trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clubs_updated_at BEFORE UPDATE ON clubs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_plans_updated_at BEFORE UPDATE ON session_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_player_profiles_updated_at BEFORE UPDATE ON player_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Frontend Architecture

### Component Architecture

#### Component Organization

```text
apps/web/src/
├── components/
│   ├── ui/                    # Base UI components (Radix + Tailwind)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── features/              # Feature-specific components
│   │   ├── session-planning/
│   │   │   ├── session-card.tsx
│   │   │   ├── drill-selector.tsx
│   │   │   └── ai-suggestions.tsx
│   │   ├── player-homework/
│   │   │   ├── homework-list.tsx
│   │   │   ├── video-player.tsx
│   │   │   └── quiz-interface.tsx
│   │   └── analytics/
│   │       ├── metrics-card.tsx
│   │       ├── chart-wrapper.tsx
│   │       └── export-button.tsx
│   └── layouts/               # Layout components
│       ├── dashboard-layout.tsx
│       ├── mobile-nav.tsx
│       └── sidebar.tsx
├── hooks/                     # Custom React hooks
│   ├── use-auth.ts
│   ├── use-role-context.ts
│   ├── use-offline-sync.ts
│   └── use-websocket.ts
├── lib/                       # Utilities and configs
│   ├── trpc.ts
│   ├── supabase.ts
│   └── utils.ts
└── app/                       # Next.js 14 app directory
    ├── (auth)/
    │   ├── login/
    │   └── onboarding/
    ├── (dashboard)/
    │   ├── layout.tsx         # Role-adaptive layout
    │   ├── page.tsx          # Unified dashboard
    │   ├── teams/[teamId]/
    │   ├── sessions/
    │   └── analytics/
    └── api/
        └── trpc/[trpc]/
```

#### Component Template

```typescript
// components/features/session-planning/session-card.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import type { SessionPlan } from '@soccer/shared/types';

interface SessionCardProps {
  session: SessionPlan;
  onEdit?: (id: string) => void;
  onShare?: (id: string) => void;
  showActions?: boolean;
}

export function SessionCard({ 
  session, 
  onEdit, 
  onShare, 
  showActions = true 
}: SessionCardProps) {
  const statusColors = {
    draft: 'bg-gray-500',
    pending_approval: 'bg-yellow-500',
    approved: 'bg-green-500',
    rejected: 'bg-red-500',
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">
            {session.theme || 'Training Session'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {formatDate(session.sessionDate)} • {session.duration} min
          </p>
        </div>
        <Badge className={statusColors[session.approvalStatus]}>
          {session.approvalStatus.replace('_', ' ')}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {session.aiGenerated && (
              <Badge variant="outline">AI Generated</Badge>
            )}
            {session.sharedWithPlayers && (
              <Badge variant="outline">Shared with Players</Badge>
            )}
          </div>
          {session.objectives.length > 0 && (
            <ul className="text-sm space-y-1">
              {session.objectives.slice(0, 3).map((obj, i) => (
                <li key={i} className="text-muted-foreground">
                  • {obj}
                </li>
              ))}
            </ul>
          )}
        </div>
        {showActions && (
          <div className="flex gap-2 mt-4">
            {onEdit && (
              <Button size="sm" variant="outline" onClick={() => onEdit(session.id)}>
                Edit
              </Button>
            )}
            {onShare && session.approvalStatus === 'approved' && (
              <Button size="sm" variant="outline" onClick={() => onShare(session.id)}>
                Share
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### State Management Architecture

#### State Structure

```typescript
// stores/auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, UserClubRole } from '@soccer/shared/types';

interface AuthState {
  user: User | null;
  roles: UserClubRole[];
  currentContext: {
    clubId?: string;
    teamId?: string;
    role?: string;
  };
  setUser: (user: User | null) => void;
  setRoles: (roles: UserClubRole[]) => void;
  setContext: (context: Partial<AuthState['currentContext']>) => void;
  getPrimaryRole: () => UserClubRole | undefined;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      roles: [],
      currentContext: {},
      
      setUser: (user) => set({ user }),
      setRoles: (roles) => set({ roles }),
      setContext: (context) => 
        set((state) => ({ 
          currentContext: { ...state.currentContext, ...context } 
        })),
      
      getPrimaryRole: () => 
        get().roles.find((r) => r.isPrimary),
      
      hasPermission: (permission) => {
        const { currentContext, roles } = get();
        const activeRole = roles.find(
          (r) => r.clubId === currentContext.clubId && 
                 r.role === currentContext.role
        );
        return activeRole?.permissions[permission] ?? false;
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        currentContext: state.currentContext 
      }),
    }
  )
);
```

#### State Management Patterns

- **Client State**: Zustand for UI state, user preferences, and current context
- **Server State**: React Query for all server data with automatic caching
- **Optimistic Updates**: Update UI immediately, rollback on error
- **Offline Queue**: Store actions locally when offline, sync when connected
- **Real-time Sync**: WebSocket subscriptions for live updates

### Routing Architecture

#### Route Organization

```text
app/
├── (auth)/                    # Public routes
│   ├── login/
│   │   └── page.tsx
│   └── signup/
│       └── page.tsx
├── (dashboard)/               # Protected routes
│   ├── layout.tsx            # Adaptive layout based on role
│   ├── page.tsx              # Unified dashboard
│   ├── clubs/[clubId]/       # Club context
│   │   ├── page.tsx          # Club overview
│   │   ├── curriculum/
│   │   ├── teams/
│   │   └── settings/
│   ├── teams/[teamId]/       # Team context
│   │   ├── page.tsx          # Team dashboard
│   │   ├── sessions/
│   │   ├── players/
│   │   └── schedule/
│   ├── players/[playerId]/   # Player context
│   │   ├── page.tsx          # Player profile
│   │   ├── homework/
│   │   └── progress/
│   └── settings/             # User settings
└── api/                      # API routes
    └── trpc/[trpc]/
```

#### Protected Route Pattern

```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { api } from '@/lib/trpc/server';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // Fetch user data with roles
  const userData = await api.auth.me.query();
  
  if (!userData.onboardingCompleted) {
    redirect('/onboarding');
  }

  return (
    <DashboardLayout user={userData}>
      {children}
    </DashboardLayout>
  );
}
```

### Frontend Services Layer

#### API Client Setup

```typescript
// lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink, wsLink, splitLink } from '@trpc/client';
import { createClient } from '@supabase/supabase-js';
import type { AppRouter } from '@soccer/api';

export const api = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function getTRPCClient(token?: string) {
  return api.createClient({
    links: [
      splitLink({
        condition: (op) => op.type === 'subscription',
        true: wsLink({
          url: `${getBaseUrl().replace('http', 'ws')}/api/trpc`,
          connectionParams: { token },
        }),
        false: httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              authorization: token ? `Bearer ${token}` : '',
            };
          },
        }),
      }),
    ],
  });
}
```

#### Service Example

```typescript
// services/session-service.ts
import { api } from '@/lib/trpc/client';
import { useAuthStore } from '@/stores/auth-store';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';

export function useSessionService() {
  const queryClient = useQueryClient();
  const { currentContext } = useAuthStore();

  const createSession = api.session.create.useMutation({
    onSuccess: (data) => {
      // Optimistically add to cache
      queryClient.setQueryData(
        ['session', 'getByTeam', { teamId: currentContext.teamId }],
        (old: any) => ({
          ...old,
          items: [data, ...(old?.items || [])],
        })
      );
      
      if (data.aiGenerated) {
        toast({
          title: 'Session plan queued',
          description: 'AI is generating your session plan...',
        });
        
        // Subscribe to updates
        subscribeToSessionUpdates(data.id);
      }
    },
    onError: (error) => {
      toast({
        title: 'Failed to create session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const subscribeToSessionUpdates = (planId: string) => {
    // WebSocket subscription for real-time updates
    const subscription = api.session.onUpdate.subscribe(
      { planId },
      {
        onData: (updatedPlan) => {
          queryClient.setQueryData(
            ['session', 'getById', { planId }],
            updatedPlan
          );
          
          if (updatedPlan.approvalStatus === 'approved') {
            toast({
              title: 'Session plan ready!',
              description: 'Your AI-generated plan is complete.',
            });
          }
        },
      }
    );

    return subscription;
  };

  return {
    createSession,
    // ... other methods
  };
}
```

## Backend Architecture

### Service Architecture

#### Function Organization

```text
apps/api/src/
├── functions/              # Lambda function handlers
│   ├── auth/
│   │   ├── handler.ts     # Auth endpoints
│   │   └── middleware.ts
│   ├── session/
│   │   ├── handler.ts     # Session management
│   │   └── validators.ts
│   ├── ai/
│   │   ├── handler.ts     # AI operations
│   │   ├── prompts.ts
│   │   └── parsers.ts
│   └── analytics/
│       ├── handler.ts     # Analytics aggregation
│       └── queries.ts
├── services/              # Business logic layer
│   ├── ai-service.ts
│   ├── youtube-service.ts
│   ├── notification-service.ts
│   └── storage-service.ts
├── repositories/          # Data access layer
│   ├── user-repository.ts
│   ├── session-repository.ts
│   ├── club-repository.ts
│   └── base-repository.ts
├── lib/                   # Shared utilities
│   ├── db.ts             # Database client
│   ├── auth.ts           # Auth helpers
│   ├── errors.ts         # Error types
│   └── logger.ts         # Logging setup
└── queues/               # Background job handlers
    ├── session-generator.ts
    ├── video-processor.ts
    └── email-sender.ts
```

#### Function Template

```typescript
// functions/session/handler.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { z } from 'zod';
import { createTRPCContext, appRouter } from '@/trpc';
import { awsLambdaRequestHandler } from '@trpc/server/adapters/aws-lambda';

// Lambda handler for session operations
export const handler: APIGatewayProxyHandler = awsLambdaRequestHandler({
  router: appRouter,
  createContext: createTRPCContext,
  responseMeta() {
    return {
      headers: {
        'cache-control': 's-maxage=1, stale-while-revalidate=59',
      },
    };
  },
});

// Specific handler for session plan generation (SQS triggered)
export const generateSessionPlanHandler = async (event: SQSEvent) => {
  const logger = getLogger();
  
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { planId, teamId, theme } = generateSessionSchema.parse(message);
      
      logger.info('Processing session generation', { planId, teamId });
      
      // Get team and curriculum data
      const team = await teamRepository.getWithCurriculum(teamId);
      if (!team) throw new Error('Team not found');
      
      // Generate AI plan
      const aiService = new AIService();
      const plan = await aiService.generateSessionPlan({
        curriculum: team.club.curriculum,
        ageGroup: team.ageGroup,
        skillLevel: team.skillLevel,
        theme,
      });
      
      // Find videos for drills
      const youtubeService = new YouTubeService();
      const drillsWithVideos = await Promise.all(
        plan.drills.map(async (drill) => {
          const videos = await youtubeService.searchDrillVideos(
            drill.name,
            team.ageGroup
          );
          return { ...drill, videoUrl: videos[0]?.url };
        })
      );
      
      // Update session plan
      await sessionRepository.update(planId, {
        drills: drillsWithVideos,
        objectives: plan.objectives,
        approvalStatus: 'pending_approval',
      });
      
      // Notify via WebSocket
      await notificationService.notifyPlanReady(planId);
      
      logger.info('Session generation completed', { planId });
    } catch (error) {
      logger.error('Session generation failed', { error, record });
      throw error; // Will trigger retry
    }
  }
};

const generateSessionSchema = z.object({
  planId: z.string().uuid(),
  teamId: z.string().uuid(),
  theme: z.string().optional(),
});
```

### Database Architecture

#### Schema Design

```sql
-- Additional tables for backend functionality

-- Job queue status tracking
CREATE TABLE job_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    attempts INTEGER DEFAULT 0,
    error TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics pre-aggregation tables
CREATE TABLE analytics_coach_engagement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    login_count INTEGER DEFAULT 0,
    plans_created INTEGER DEFAULT 0,
    plans_approved INTEGER DEFAULT 0,
    ai_usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, coach_id, week_start)
);

CREATE TABLE analytics_player_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES player_profiles(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    homework_completed INTEGER DEFAULT 0,
    quiz_avg_score DECIMAL(5,2),
    idp_progress DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(club_id, player_id, month)
);

-- Notification queue
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_job_status_entity ON job_status(entity_id);
CREATE INDEX idx_job_status_created ON job_status(created_at);
CREATE INDEX idx_analytics_coach_week ON analytics_coach_engagement(week_start);
CREATE INDEX idx_analytics_player_month ON analytics_player_progress(month);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, read) WHERE read = false;
```

#### Data Access Layer

```typescript
// repositories/base-repository.ts
import { PrismaClient } from '@prisma/client';
import { getLogger } from '@/lib/logger';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected logger: Logger;
  protected tenantId?: string;

  constructor(prisma: PrismaClient, tenantId?: string) {
    this.prisma = prisma;
    this.logger = getLogger();
    this.tenantId = tenantId;
  }

  protected applyTenantFilter(where: any) {
    if (!this.tenantId) return where;
    
    return {
      ...where,
      club: { id: this.tenantId },
    };
  }

  protected handleError(error: any, operation: string) {
    this.logger.error(`Repository error in ${operation}`, { error });
    
    if (error.code === 'P2002') {
      throw new ConflictError('Resource already exists');
    }
    if (error.code === 'P2025') {
      throw new NotFoundError('Resource not found');
    }
    
    throw new DatabaseError(`Database operation failed: ${operation}`);
  }
}

// repositories/session-repository.ts
export class SessionRepository extends BaseRepository<SessionPlan> {
  async create(data: CreateSessionPlanInput): Promise<SessionPlan> {
    try {
      return await this.prisma.sessionPlan.create({
        data: {
          ...data,
          team: {
            connect: { id: data.teamId }
          },
          createdBy: {
            connect: { id: data.createdBy }
          }
        },
        include: {
          team: true,
          createdBy: true,
        }
      });
    } catch (error) {
      this.handleError(error, 'create session plan');
    }
  }

  async findByTeam(
    teamId: string, 
    options: { 
      status?: string; 
      limit?: number; 
      cursor?: string;
    } = {}
  ): Promise<PaginatedResult<SessionPlan>> {
    const where = {
      teamId,
      ...(options.status && { approvalStatus: options.status }),
    };

    const [items, total] = await Promise.all([
      this.prisma.sessionPlan.findMany({
        where,
        take: options.limit || 20,
        skip: options.cursor ? 1 : 0,
        cursor: options.cursor ? { id: options.cursor } : undefined,
        orderBy: { sessionDate: 'desc' },
        include: {
          createdBy: true,
          approvedBy: true,
        },
      }),
      this.prisma.sessionPlan.count({ where }),
    ]);

    return {
      items,
      total,
      hasMore: items.length === (options.limit || 20),
      nextCursor: items[items.length - 1]?.id,
    };
  }

  async updateWithRetry(
    id: string, 
    data: UpdateSessionPlanInput,
    maxRetries = 3
  ): Promise<SessionPlan> {
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        return await this.prisma.sessionPlan.update({
          where: { id },
          data: {
            ...data,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        attempt++;
        if (attempt >= maxRetries) {
          this.handleError(error, 'update session plan');
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }
    }
  }
}
```

### Authentication and Authorization

#### Auth Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Supabase
    participant API
    participant DB

    User->>Frontend: Login with email/password
    Frontend->>Supabase: signInWithPassword()
    Supabase->>Supabase: Validate credentials
    Supabase-->>Frontend: JWT token + refresh token
    
    Frontend->>API: Request with Bearer token
    API->>Supabase: Verify JWT
    Supabase-->>API: Token claims
    
    API->>DB: Get user roles
    DB-->>API: User roles & permissions
    
    API->>API: Check permissions
    API-->>Frontend: Authorized response
```

#### Middleware/Guards

```typescript
// lib/auth/middleware.ts
import { TRPCError } from '@trpc/server';
import { verify } from 'jsonwebtoken';
import { supabase } from '@/lib/supabase';

export const authMiddleware = async (req: Request) => {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'No authorization token provided' 
    });
  }

  try {
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED',
        message: 'Invalid token' 
      });
    }

    return { user };
  } catch (error) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Token verification failed' 
    });
  }
};

// Permission guard factory
export const requirePermission = (permission: string) => {
  return async (ctx: Context) => {
    const { user, tenantId } = ctx;
    
    // Get user's role in current context
    const role = await prisma.userClubRole.findFirst({
      where: {
        userId: user.id,
        clubId: tenantId,
      },
    });

    if (!role || !role.permissions[permission]) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Missing required permission: ${permission}`,
      });
    }

    return true;
  };
};

// Usage in tRPC procedures
export const protectedProcedure = t.procedure
  .use(authMiddleware)
  .use(async ({ ctx, next }) => {
    // Load user's full profile
    const userWithRoles = await userRepository.getWithRoles(ctx.user.id);
    
    return next({
      ctx: {
        ...ctx,
        user: userWithRoles,
        permissions: new PermissionChecker(userWithRoles),
      },
    });
  });

export const coachProcedure = protectedProcedure
  .use(requirePermission('session.create'));

export const docProcedure = protectedProcedure
  .use(requirePermission('curriculum.edit'));
```

## Unified Project Structure

```plaintext
project-unify/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml            # Test, lint, type-check
│       └── deploy.yaml        # Deploy to Vercel/AWS
├── apps/                       # Application packages
│   ├── web/                    # Frontend Next.js app
│   │   ├── src/
│   │   │   ├── app/           # Next.js app router
│   │   │   ├── components/    # React components
│   │   │   ├── hooks/         # Custom hooks
│   │   │   ├── stores/        # Zustand stores
│   │   │   ├── services/      # API services
│   │   │   └── lib/           # Utilities
│   │   ├── public/            # Static assets
│   │   ├── tests/             # Frontend tests
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   └── api/                    # Backend serverless API
│       ├── src/
│       │   ├── functions/     # Lambda handlers
│       │   ├── services/      # Business logic
│       │   ├── repositories/  # Data access
│       │   ├── lib/           # Shared utilities
│       │   ├── queues/        # SQS handlers
│       │   └── trpc/          # tRPC setup
│       ├── tests/             # Backend tests
│       ├── serverless.yml     # SST config
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utils
│   │   ├── src/
│   │   │   ├── types/         # TypeScript types
│   │   │   │   ├── models.ts # Data models
│   │   │   │   ├── api.ts    # API types
│   │   │   │   └── index.ts
│   │   │   ├── constants/     # Shared constants
│   │   │   └── utils/         # Shared utilities
│   │   ├── tsconfig.json
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   └── index.ts
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── eslint/
│       │   └── index.js
│       ├── typescript/
│       │   └── base.json
│       └── jest/
│           └── preset.js
├── infrastructure/             # IaC definitions
│   ├── aws/                   # AWS resources
│   │   ├── lambda.ts         # Function definitions
│   │   ├── database.ts       # RDS setup
│   │   ├── queues.ts         # SQS configuration
│   │   └── storage.ts        # S3 buckets
│   ├── sst.config.ts          # SST configuration
│   └── README.md
├── scripts/                    # Build/deploy scripts
│   ├── setup.sh               # Initial setup
│   ├── seed-db.ts            # Database seeding
│   └── generate-types.ts     # Type generation
├── docs/                       # Project documentation
│   ├── project-brief.md
│   ├── prd.md
│   ├── front-end-spec.md
│   └── architecture.md        # This document
├── .env.example                # Environment template
├── package.json                # Root package.json
├── turbo.json                  # Turborepo config
├── pnpm-workspace.yaml         # PNPM workspace
└── README.md                   # Project README

## Key Files Explained

### Root Configuration Files

**turbo.json** - Turborepo pipeline configuration
```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

**pnpm-workspace.yaml** - Workspace packages
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### Shared Types Package

**packages/shared/src/types/models.ts**
```typescript
// All TypeScript interfaces from Data Models section
export * from './user';
export * from './club';
export * from './session';
// ... etc
```

### Environment Configuration

**.env.example**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# OpenAI
OPENAI_API_KEY=your-openai-key

# YouTube
YOUTUBE_API_KEY=your-youtube-key

# SendGrid
SENDGRID_API_KEY=your-sendgrid-key

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://localhost:6379
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Required tools
node --version  # 18.17+ required
pnpm --version  # 8.0+ required
docker --version  # For local Postgres

# Optional but recommended
aws --version  # For AWS services
supabase --version  # For local Supabase
```

#### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/project-unify.git
cd project-unify

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env

# Start local services
docker-compose up -d  # Postgres, Redis

# Initialize database
pnpm db:migrate
pnpm db:seed

# Start development
pnpm dev
```

#### Development Commands

```bash
# Start all services
pnpm dev

# Start frontend only
pnpm dev:web

# Start backend only  
pnpm dev:api

# Run tests
pnpm test
pnpm test:watch
pnpm test:e2e

# Type checking
pnpm typecheck

# Linting
pnpm lint
pnpm lint:fix

# Build all packages
pnpm build

# Database commands
pnpm db:migrate
pnpm db:seed
pnpm db:studio  # Prisma Studio
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soccer_platform
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/soccer_platform
REDIS_URL=redis://localhost:6379
SUPABASE_SERVICE_KEY=your-service-key

# API Keys (both)
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=AIza...
SENDGRID_API_KEY=SG...

# AWS (backend only)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel
- **Build Command:** `pnpm build:web`
- **Output Directory:** `apps/web/.next`
- **CDN/Edge:** Vercel Edge Network globally

**Backend Deployment:**
- **Platform:** AWS Lambda via SST
- **Build Command:** `pnpm build:api`
- **Deployment Method:** `pnpm deploy:api`

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v3
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-api:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      
      - run: pnpm install
      - run: pnpm build:api
      
      - name: Deploy to AWS
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          cd apps/api
          pnpm sst deploy --stage prod
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3001 | Local development |
| Staging | https://staging.soccerplatform.app | https://api-staging.soccerplatform.app | Pre-production testing |
| Production | https://soccerplatform.app | https://api.soccerplatform.app | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.soccerplatform.app`
- XSS Prevention: React's built-in escaping + input validation
- Secure Storage: Sensitive data in httpOnly cookies, tokens in memory only

**Backend Security:**
- Input Validation: Zod schemas on all endpoints
- Rate Limiting: 100 req/min per IP, 1000 req/min per user
- CORS Policy: Origin whitelist for production domains

**Authentication Security:**
- Token Storage: httpOnly cookies for refresh tokens, memory for access tokens
- Session Management: 15-minute access tokens, 7-day refresh tokens
- Password Policy: Minimum 8 characters, complexity requirements enforced by Supabase

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 200KB initial JS (gzipped)
- Loading Strategy: Route-based code splitting, lazy loading for features
- Caching Strategy: SWR for API calls, 24-hour cache for static content

**Backend Performance:**
- Response Time Target: p95 < 200ms for API calls
- Database Optimization: Connection pooling, prepared statements, query optimization
- Caching Strategy: Redis for session data, 5-minute cache for analytics

## Testing Strategy

### Testing Pyramid

```
                  E2E Tests
                 /        \
            Integration Tests
               /            \
          Frontend Unit  Backend Unit
```

### Test Organization

#### Frontend Tests

```text
apps/web/tests/
├── unit/              # Component tests
│   ├── components/
│   └── hooks/
├── integration/       # Page tests
│   ├── auth/
│   └── dashboard/
└── e2e/              # User flows
    ├── coach-flow.spec.ts
    └── player-flow.spec.ts
```

#### Backend Tests

```text
apps/api/tests/
├── unit/              # Service tests
│   ├── services/
│   └── repositories/
├── integration/       # API tests
│   ├── auth/
│   └── session/
└── e2e/              # Full flow tests
```

#### E2E Tests

```text
tests/e2e/
├── fixtures/         # Test data
├── pages/           # Page objects
└── specs/           # Test specs
    ├── auth.spec.ts
    ├── session-planning.spec.ts
    └── player-homework.spec.ts
```

### Test Examples

#### Frontend Component Test

```typescript
// apps/web/tests/unit/components/session-card.test.tsx
import { render, screen } from '@testing-library/react';
import { SessionCard } from '@/components/features/session-planning/session-card';

describe('SessionCard', () => {
  const mockSession = {
    id: '123',
    theme: 'Passing Patterns',
    sessionDate: new Date('2024-01-15'),
    duration: 90,
    approvalStatus: 'approved' as const,
    aiGenerated: true,
    objectives: ['Improve passing accuracy', 'Build team chemistry'],
  };

  it('displays session information correctly', () => {
    render(<SessionCard session={mockSession} />);
    
    expect(screen.getByText('Passing Patterns')).toBeInTheDocument();
    expect(screen.getByText('90 min')).toBeInTheDocument();
    expect(screen.getByText('approved')).toBeInTheDocument();
    expect(screen.getByText('AI Generated')).toBeInTheDocument();
  });

  it('shows objectives when available', () => {
    render(<SessionCard session={mockSession} />);
    
    expect(screen.getByText('• Improve passing accuracy')).toBeInTheDocument();
    expect(screen.getByText('• Build team chemistry')).toBeInTheDocument();
  });
});
```

#### Backend API Test

```typescript
// apps/api/tests/integration/session.test.ts
import { createTestContext } from '../helpers';
import { appRouter } from '@/trpc/routers';

describe('Session API', () => {
  let ctx: TestContext;
  
  beforeEach(async () => {
    ctx = await createTestContext();
  });

  afterEach(async () => {
    await ctx.cleanup();
  });

  it('creates AI-generated session plan', async () => {
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.session.create({
      teamId: ctx.team.id,
      sessionDate: new Date('2024-01-20'),
      duration: 90,
      useAI: true,
      theme: 'Defensive Shape',
    });

    expect(result.id).toBeDefined();
    expect(result.aiGenerated).toBe(true);
    expect(result.approvalStatus).toBe('draft');
    
    // Verify job was queued
    const job = await ctx.db.jobStatus.findFirst({
      where: { entityId: result.id }
    });
    expect(job?.status).toBe('pending');
  });
});
```

#### E2E Test

```typescript
// tests/e2e/specs/coach-session-flow.spec.ts
import { test, expect } from '@playwright/test';
import { CoachDashboard } from '../pages/coach-dashboard';
import { SessionPlanner } from '../pages/session-planner';

test.describe('Coach Session Planning Flow', () => {
  test('coach creates and shares AI session plan', async ({ page }) => {
    // Login as coach
    await page.goto('/login');
    await page.fill('[name=email]', 'coach@example.com');
    await page.fill('[name=password]', 'password123');
    await page.click('button[type=submit]');
    
    // Navigate to session planning
    const dashboard = new CoachDashboard(page);
    await dashboard.navigateToSessions();
    
    // Create new session
    const planner = new SessionPlanner(page);
    await planner.createSession({
      date: '2024-01-20',
      duration: 90,
      useAI: true,
      theme: 'Passing and Movement',
    });
    
    // Wait for AI generation
    await expect(page.locator('.session-status')).toContainText('Ready', {
      timeout: 30000
    });
    
    // Review and approve
    await planner.reviewSession();
    await planner.approveSession();
    
    // Share with players
    await planner.shareWithPlayers();
    
    // Verify success
    await expect(page.locator('.toast')).toContainText('Session shared successfully');
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Async Operations:** Always use queues for operations that could take > 5 seconds
- **Multi-tenancy:** Every database query must respect tenant boundaries
- **Permissions:** Check permissions at the resolver level, not in UI
- **Caching:** Use React Query for all server state, no manual caching
- **Type Safety:** No any types except in exceptional circumstances with comment

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |
| Environment Variables | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |
| TypeScript Types | PascalCase | PascalCase | `SessionPlan` |
| File Names | kebab-case | kebab-case | `session-card.tsx` |
| tRPC Procedures | camelCase | camelCase | `createSession` |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Service
    participant External

    User->>Frontend: Trigger action
    Frontend->>API: API call
    
    alt Success
        API->>Service: Process request
        Service-->>API: Success result
        API-->>Frontend: 200 OK
        Frontend-->>User: Success UI
    else Business Error
        API->>Service: Process request
        Service-->>API: Throw BusinessError
        API-->>Frontend: 400 with details
        Frontend-->>User: User-friendly error
    else External Error
        API->>External: External call
        External-->>API: Timeout/Error
        API-->>Frontend: 503 Service Unavailable
        Frontend-->>User: "Try again" message
    else Unexpected Error
        API->>Service: Process request
        Service-->>API: Throw unexpected
        API-->>Frontend: 500 Internal Error
        Frontend-->>User: Generic error
        Frontend->>Frontend: Log to Sentry
    end
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

```typescript
// hooks/use-error-handler.ts
export function useErrorHandler() {
  return useCallback((error: unknown) => {
    if (error instanceof TRPCError) {
      if (error.code === 'UNAUTHORIZED') {
        router.push('/login');
        return;
      }
      
      if (error.code === 'FORBIDDEN') {
        toast.error('You do not have permission to perform this action');
        return;
      }
      
      toast.error(error.message);
      return;
    }
    
    // Log to Sentry
    Sentry.captureException(error);
    toast.error('An unexpected error occurred');
  }, []);
}
```

### Backend Error Handling

```typescript
// lib/errors.ts
export class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode = 400,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string, details?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string) {
    super('NOT_FOUND', `${resource} not found`, 404);
  }
}

// Global error handler
export function handleError(error: unknown): TRPCError {
  if (error instanceof BusinessError) {
    return new TRPCError({
      code: 'BAD_REQUEST',
      message: error.message,
      cause: error,
    });
  }
  
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return new TRPCError({
        code: 'CONFLICT',
        message: 'Resource already exists',
      });
    }
  }
  
  // Log unexpected errors
  logger.error('Unexpected error', { error });
  
  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics + Sentry
- **Backend Monitoring:** CloudWatch + Sentry
- **Error Tracking:** Sentry for both frontend and backend
- **Performance Monitoring:** Vercel Web Analytics, CloudWatch Insights

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors by page
- API response times from client perspective
- User interactions (clicks, form submissions)

**Backend Metrics:**
- Request rate by endpoint
- Error rate by type
- Response time percentiles (p50, p95, p99)
- Database query performance
- AI API usage and costs
- Queue depth and processing time

## Checklist Results Report

Before finalizing this architecture document, here's a comprehensive checklist validation:

### Architecture Completeness Checklist

- [x] **System Overview**: Clear high-level architecture with component relationships
- [x] **Technology Stack**: Definitive technology choices with rationale
- [x] **Data Models**: Complete entity definitions with TypeScript interfaces
- [x] **API Design**: tRPC specifications with type-safe examples
- [x] **Security**: Authentication flow, authorization patterns, security headers
- [x] **Performance**: Specific targets and optimization strategies
- [x] **Deployment**: CI/CD pipeline and multi-environment strategy
- [x] **Testing**: Comprehensive testing pyramid with examples
- [x] **Error Handling**: Structured approach with error types and flows
- [x] **Monitoring**: Observability strategy with key metrics

### Technical Decisions Validation

- [x] **Scalability**: Serverless architecture scales automatically
- [x] **Multi-tenancy**: Row-level security ensures data isolation
- [x] **Offline Support**: PWA with service workers enables offline use
- [x] **Real-time**: WebSocket support for live updates
- [x] **Type Safety**: End-to-end types with tRPC and TypeScript
- [x] **Budget Conscious**: Pay-per-use services fit $5000 constraint

### Development Readiness

- [x] **Project Structure**: Clear monorepo organization
- [x] **Development Workflow**: Documented setup and commands
- [x] **Coding Standards**: Specific rules for consistency
- [x] **Environment Config**: All required variables documented
- [x] **Testing Strategy**: Unit, integration, and E2E examples

This architecture provides a solid foundation for building the Youth Soccer AI Platform with:
- Clear separation of concerns
- Type safety throughout
- Scalable serverless backend
- Modern frontend with PWA capabilities
- Comprehensive testing approach
- Strong security and multi-tenancy

The document is ready for handoff to development teams and can serve as the authoritative technical reference throughout the project lifecycle.