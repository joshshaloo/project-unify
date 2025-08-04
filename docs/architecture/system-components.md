# System Components

## Next.js Full-Stack Application (Containerized)

**Responsibility:** Complete web application serving both frontend and API
**Key Features:**
- Server Components for initial page loads
- Client Components for interactivity  
- API routes running tRPC
- Containerized with multi-stage Docker builds
- Built-in image optimization
- Automatic code splitting
- Health check endpoints for container orchestration

**Technology Stack:** Next.js 14+, React 18+, TypeScript, tRPC, Docker

## Authentication (NextAuth)

**Responsibility:** Passwordless authentication via email using NextAuth
**Key Features:**
- Email provider for passwordless authentication
- Database session management via Prisma adapter
- Secure token generation and verification
- Email-based user verification (magic links)
- Automatic user account creation
- Cookie-based session persistence with CSRF protection
- Built-in security features (rate limiting, token rotation)

**Technology Stack:** NextAuth 5.0+ with Nodemailer provider, Prisma adapter, PostgreSQL

## Database Layer

**Responsibility:** Data persistence and queries
**Key Features:**
- Prisma ORM for type-safe queries
- PostgreSQL in Docker container
- Automatic migrations via Prisma
- Connection pooling with pgBouncer
- Backup via Docker volume snapshots
- Consistent across all environments

**Technology Stack:** Prisma 5+, PostgreSQL 15+, Docker volumes

## AI Agent System (via n8n)

**Responsibility:** Multi-agent AI orchestration for intelligent coaching assistance
**Architecture:** Visual workflow-based agent system using n8n

**AI Agents:**
1. **Coach Winston** - Strategic session planning and drill progression
2. **Scout Emma** - Player development tracking and personalization
3. **Physio Alex** - Health monitoring and load management
4. **Motivator Sam** - Team morale and engagement optimization
5. **Analyst Jordan** - Performance analytics and insights

**Key Features:**
- Visual workflow design for rapid iteration
- Agent memory persistence in Supabase
- Multi-agent collaboration patterns
- Webhook-based communication with Next.js
- Parallel agent execution for complex tasks
- Built-in error handling and retries

**n8n Workflow Patterns:**
```yaml
Base Agent Template:
  - Webhook trigger (from Next.js)
  - Context retrieval (Supabase)
  - Agent personality injection
  - OpenAI completion
  - Response processing
  - Memory update
  - Webhook response

Multi-Agent Orchestration:
  - Parallel agent invocation
  - Result synthesis
  - Conflict resolution
  - Final output generation
```

**Integration with Next.js:**
```typescript
// Invoke n8n workflow from tRPC
const n8nClient = new N8NWorkflowClient();
const session = await n8nClient.triggerWorkflow(
  'coach-winston-session-generator',
  { teamId, duration, focus }
);
```
