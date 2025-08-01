# Coding Standards & Best Practices

## Critical Rules

### 1. Type Sharing
```typescript
// ❌ BAD - Defining types in component files
interface SessionPlan {
  id: string;
  // ...
}

// ✅ GOOD - Import from shared package
import { SessionPlan } from '@soccer/shared/types';
```

### 2. API Calls
```typescript
// ❌ BAD - Direct HTTP calls
const response = await fetch('/api/sessions');

// ✅ GOOD - Use tRPC service layer
const { data } = api.session.getByTeam.useQuery({ teamId });
```

### 3. Environment Variables
```typescript
// ❌ BAD - Direct process.env access
const apiKey = process.env.OPENAI_API_KEY;

// ✅ GOOD - Use config objects
import { config } from '@/lib/config';
const apiKey = config.openai.apiKey;
```

### 4. Error Handling
```typescript
// ❌ BAD - Unhandled errors
async function createSession(data) {
  return await db.session.create(data);
}

// ✅ GOOD - Proper error handling
async function createSession(data) {
  try {
    return await db.session.create(data);
  } catch (error) {
    throw new BusinessError('SESSION_CREATE_FAILED', 'Failed to create session');
  }
}
```

### 5. State Management
```typescript
// ❌ BAD - Direct mutation
state.users.push(newUser);

// ✅ GOOD - Immutable updates
setState(prev => ({
  ...prev,
  users: [...prev.users, newUser]
}));
```

### 6. Async Operations
```typescript
// ❌ BAD - Long-running in request handler
async function generatePlan(req, res) {
  const plan = await generateWithAI(req.body); // 30+ seconds
  res.json(plan);
}

// ✅ GOOD - Queue for async processing
async function generatePlan(req, res) {
  const jobId = await queue.send('generate-plan', req.body);
  res.json({ jobId, status: 'processing' });
}
```

### 7. Multi-tenancy
```typescript
// ❌ BAD - Missing tenant filter
const teams = await db.team.findMany();

// ✅ GOOD - Always filter by tenant
const teams = await db.team.findMany({
  where: { clubId: ctx.tenantId }
});
```

### 8. Permissions
```typescript
// ❌ BAD - UI-only permission check
{user.role === 'coach' && <EditButton />}

// ✅ GOOD - Server-side check
const canEdit = await api.session.checkPermission.query({ 
  action: 'edit',
  resource: sessionId 
});
```

### 9. Caching
```typescript
// ❌ BAD - Manual cache management
const [data, setData] = useState(null);
useEffect(() => {
  fetch('/api/data').then(r => r.json()).then(setData);
}, []);

// ✅ GOOD - Use React Query
const { data } = api.data.get.useQuery();
```

### 10. Type Safety
```typescript
// ❌ BAD - Using any
function processData(data: any) {
  return data.map((item: any) => item.name);
}

// ✅ GOOD - Proper types
function processData(data: User[]) {
  return data.map(user => user.name);
}
```

## Naming Conventions

### Files & Folders
```
components/
├── session-card.tsx       // kebab-case
├── use-auth.ts           // kebab-case for hooks
└── session-types.ts      // kebab-case
```

### React Components
```typescript
// PascalCase for components
export function SessionCard() { }
export const UserProfile = () => { };

// Props interfaces
interface SessionCardProps { }
```

### Functions & Variables
```typescript
// camelCase for functions
function calculateDuration() { }
const getUserById = () => { };

// camelCase for variables
const sessionPlan = {};
let isLoading = false;

// SCREAMING_SNAKE_CASE for constants
const MAX_RETRIES = 3;
const API_TIMEOUT = 5000;
```

### Database
```sql
-- snake_case for tables and columns
CREATE TABLE session_plans (
  id UUID,
  created_by UUID,
  session_date DATE
);
```

### API Routes
```typescript
// camelCase for tRPC procedures
router.createSession
router.getByTeam
router.updateSharing

// URL paths use kebab-case
/api/session-plans
/api/user-profiles
```

## Code Organization

### Component Structure
```typescript
// 1. Imports
import { useState } from 'react';
import { api } from '@/lib/trpc';
import type { Session } from '@soccer/shared/types';

// 2. Types
interface Props {
  session: Session;
}

// 3. Component
export function SessionCard({ session }: Props) {
  // 4. State
  const [isEditing, setIsEditing] = useState(false);
  
  // 5. Queries/Mutations
  const updateSession = api.session.update.useMutation();
  
  // 6. Handlers
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  // 7. Render
  return <div>...</div>;
}
```

### Service Structure
```typescript
export class SessionService {
  constructor(
    private db: PrismaClient,
    private ai: AIService
  ) {}

  async create(data: CreateSessionInput): Promise<Session> {
    // Validation
    const validated = sessionSchema.parse(data);
    
    // Business logic
    if (validated.useAI) {
      return this.createWithAI(validated);
    }
    
    // Database operation
    return this.db.session.create({ data: validated });
  }
}
```

## Testing Standards

### Test File Naming
```
session-card.tsx       → session-card.test.tsx
session-service.ts     → session-service.test.ts
create-session.ts      → create-session.e2e.ts
```

### Test Structure
```typescript
describe('SessionCard', () => {
  // Setup
  let mockSession: Session;
  
  beforeEach(() => {
    mockSession = createMockSession();
  });
  
  // Group related tests
  describe('rendering', () => {
    it('displays session title', () => {
      // Arrange
      const { getByText } = render(<SessionCard session={mockSession} />);
      
      // Act & Assert
      expect(getByText(mockSession.title)).toBeInTheDocument();
    });
  });
  
  describe('interactions', () => {
    it('calls onEdit when edit clicked', () => {
      // Test implementation
    });
  });
});
```

## Documentation

### Component Documentation
```typescript
/**
 * SessionCard displays a training session plan card
 * 
 * @example
 * <SessionCard 
 *   session={session}
 *   onEdit={handleEdit}
 *   showActions
 * />
 */
export function SessionCard(props: SessionCardProps) { }
```

### Function Documentation
```typescript
/**
 * Generates an AI-powered session plan
 * 
 * @param teamId - The team to generate for
 * @param context - Optional context for generation
 * @returns Promise resolving to generated session
 * @throws {BusinessError} If team not found
 */
async function generateSessionPlan(
  teamId: string,
  context?: GenerationContext
): Promise<Session> { }
```

## Git Conventions

### Branch Naming
```
feature/add-session-planning
fix/coach-permission-bug
chore/update-dependencies
docs/api-documentation
```

### Commit Messages
```
feat: add AI session generation
fix: resolve timezone issue in calendar
docs: update setup instructions
test: add session service tests
refactor: extract drill component
style: format with prettier
```

## Performance Guidelines

### React
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Lazy load routes and heavy components
- Optimize re-renders with useCallback/useMemo

### API
- Implement pagination for lists
- Use cursor-based pagination for large datasets
- Include only necessary fields in queries
- Cache expensive computations

### Database
- Always use indexes for foreign keys
- Implement soft deletes
- Use database transactions for multi-step operations
- Optimize N+1 queries with includes