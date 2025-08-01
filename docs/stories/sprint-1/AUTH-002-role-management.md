# AUTH-002: Multi-role support

**Type:** Authentication  
**Points:** 3  
**Priority:** P0 (Blocker)  
**Dependencies:** AUTH-001  

## Description
Implement the multi-role system allowing users to have different roles across clubs and teams, with seamless context switching based on current activity.

## Acceptance Criteria
- [ ] Role-based permissions system implemented
- [ ] Users can have multiple roles per club
- [ ] Context detection for current role
- [ ] Permission checks in API middleware
- [ ] Role indicators in UI
- [ ] Admin can assign/revoke roles
- [ ] Role expiration support
- [ ] Audit trail for role changes

## Technical Details

### Permission System
```typescript
// packages/shared/types/permissions.ts
export const permissions = {
  doc: {
    analytics: ['view', 'export'],
    curriculum: ['view', 'edit', 'approve'],
    coaches: ['view', 'manage', 'evaluate'],
    settings: ['view', 'edit'],
  },
  head_coach: {
    sessions: ['view', 'create', 'edit', 'delete'],
    team: ['view', 'manage'],
    players: ['view', 'evaluate'],
    approvals: ['submit', 'delegate'],
  },
  assistant_coach: {
    sessions: ['view', 'create', 'edit'],
    team: ['view'],
    players: ['view', 'evaluate'],
  },
  parent: {
    players: ['view:own'],
    sessions: ['view:shared'],
    homework: ['view:own'],
  },
  player: {
    sessions: ['view:assigned'],
    homework: ['view:own', 'submit'],
    progress: ['view:own'],
  }
} as const;
```

### Context Detection
```typescript
// apps/api/src/middleware/auth.ts
export async function getRoleContext(
  userId: string, 
  resource: { type: string; id: string }
): Promise<UserRole> {
  // Determine role based on resource being accessed
  if (resource.type === 'team') {
    const teamRole = await db.teamMember.findFirst({
      where: { 
        userId, 
        teamId: resource.id 
      },
      include: { 
        team: { 
          include: { club: true } 
        } 
      }
    });
    
    return teamRole?.role || 'viewer';
  }
  
  if (resource.type === 'club') {
    const clubRole = await db.userClubRole.findFirst({
      where: { 
        userId, 
        clubId: resource.id,
        isPrimary: true 
      }
    });
    
    return clubRole?.role || 'viewer';
  }
}
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