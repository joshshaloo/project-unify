# AUTH-002: Role-based access control

**Type:** Authentication  
**Points:** 3  
**Priority:** P0 (Blocker)  
**Dependencies:** AUTH-001  

## Description
Implement role-based access control using the current UserClub model. Support admin, head_coach, assistant_coach, and parent roles with appropriate permissions for each club context.

## Acceptance Criteria
- [ ] Role-based middleware for tRPC procedures
- [ ] Users can have different roles per club (via UserClub table)
- [ ] Permission checks based on current club context
- [ ] Role indicators in UI components
- [ ] Admin can invite users with specific roles
- [ ] Role status management (active, inactive, invited)
- [ ] Club-scoped authorization checks
- [ ] Audit trail for role changes

## Technical Details

### Current Database Schema (UserClub Model)
```typescript
// From apps/web/prisma/schema.prisma (already implemented)
model UserClub {
  id        String   @id @default(cuid())
  userId    String
  clubId    String
  role      String   // admin, head_coach, assistant_coach, parent
  status    String   @default("active") // active, inactive, invited
  joinedAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  club Club @relation(fields: [clubId], references: [id])

  @@unique([userId, clubId])
  @@map("user_clubs")
}
```

### Permission System (Simplified for MVP)
```typescript
// apps/web/src/lib/auth/roles.ts (to be implemented)
export const ROLES = {
  admin: {
    sessions: ['create', 'read', 'update', 'delete'],
    teams: ['create', 'read', 'update', 'delete'],
    players: ['create', 'read', 'update', 'delete'],
    users: ['invite', 'manage'],
    club: ['settings', 'billing'],
  },
  head_coach: {
    sessions: ['create', 'read', 'update', 'delete'],
    teams: ['read', 'update'],
    players: ['create', 'read', 'update'],
    users: ['view'],
  },
  assistant_coach: {
    sessions: ['create', 'read', 'update'],
    teams: ['read'],
    players: ['read', 'update'],
  },
  parent: {
    sessions: ['read:own_player'],
    players: ['read:own'],
  },
} as const;

export type Role = keyof typeof ROLES;
export type Permission = string;
```

### tRPC Middleware for Role Checking
```typescript
// apps/web/src/lib/trpc/procedures.ts (to be implemented)
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

export const requireAuth = middleware(async ({ next, ctx }) => {
  const session = await auth()
  
  if (!session?.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  
  return next({
    ctx: {
      ...ctx,
      session,
      userId: session.user.id,
    },
  })
})

export const requireClubAccess = (clubId: string) => middleware(async ({ next, ctx }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  
  const userClub = await prisma.userClub.findUnique({
    where: {
      userId_clubId: {
        userId: ctx.userId,
        clubId,
      },
      status: 'active',
    },
  })
  
  if (!userClub) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'No access to this club' })
  }
  
  return next({
    ctx: {
      ...ctx,
      userClub,
      role: userClub.role,
    },
  })
})

export const requireRole = (allowedRoles: string[]) => middleware(async ({ next, ctx }) => {
  if (!ctx.role || !allowedRoles.includes(ctx.role)) {
    throw new TRPCError({ 
      code: 'FORBIDDEN', 
      message: `Requires one of: ${allowedRoles.join(', ')}` 
    })
  }
  
  return next({ ctx })
})
```

### UI Role Indicators
```typescript
// apps/web/src/components/layout/role-indicator.tsx
export function RoleIndicator() {
  const { user } = useAuth();
  const { currentRole, availableRoles } = useRoleContext();
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline">
        {roleLabels[currentRole]}
      </Badge>
      {availableRoles.length > 1 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Icons.multiRole className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent>
              You have multiple roles in this context
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}
```

## Implementation Steps
1. Define permission constants
2. Create role context detection
3. Implement permission middleware
4. Add role checks to all endpoints
5. Build role management UI
6. Create role assignment API
7. Add audit logging
8. Test permission boundaries

## Testing Scenarios
- User with single role sees appropriate content
- User with multiple roles gets union of permissions  
- Expired roles are not considered
- Permission denied returns 403
- Role changes take effect immediately
- Audit trail captures all changes

## Edge Cases
- User removed from club mid-session
- Role expires during active session
- Conflicting permissions resolved correctly
- Primary role designation works

## Notes
- Cache role lookups for performance
- Consider role inheritance later
- Plan for custom roles in future
- Monitor permission check performance