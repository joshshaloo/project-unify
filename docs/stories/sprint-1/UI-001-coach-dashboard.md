# UI-001: Basic coach dashboard

**Type:** User Interface  
**Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** AUTH-002, TECH-001  

## Description
Create the foundational coach dashboard that serves as the primary interface for coaches to access teams, view upcoming sessions, and initiate planning. Focus on mobile-responsive design and core functionality.

## Acceptance Criteria
- [ ] Dashboard layout with navigation
- [ ] Team selector/switcher
- [ ] Upcoming sessions view (next 7 days)
- [ ] Quick actions (New Session, View Team)
- [ ] Recent activity feed
- [ ] Mobile responsive design
- [ ] Loading and empty states
- [ ] Basic analytics widgets
- [ ] Role-based content visibility

## Technical Details

### Dashboard Layout Structure
```typescript
// apps/web/src/app/(app)/dashboard/page.tsx
export default async function DashboardPage() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <UpcomingSessions />
        </Card>
        <Card>
          <QuickActions />
        </Card>
        <Card className="md:col-span-2 lg:col-span-3">
          <RecentActivity />
        </Card>
      </div>
    </DashboardLayout>
  );
}
```

### Team Context Provider
```typescript
// apps/web/src/contexts/team-context.tsx
export function TeamProvider({ children }: { children: ReactNode }) {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const { data: teams } = api.team.getMyTeams.useQuery();
  
  useEffect(() => {
    // Auto-select primary team or last used
    if (teams?.length > 0 && !selectedTeam) {
      const primary = teams.find(t => t.isPrimary);
      setSelectedTeam(primary || teams[0]);
    }
  }, [teams]);
  
  return (
    <TeamContext.Provider value={{ 
      selectedTeam, 
      setSelectedTeam,
      teams: teams || [] 
    }}>
      {children}
    </TeamContext.Provider>
  );
}
```

### Upcoming Sessions Component
```typescript
// apps/web/src/components/dashboard/upcoming-sessions.tsx
export function UpcomingSessions() {
  const { selectedTeam } = useTeam();
  const { data: sessions, isLoading } = api.session.getUpcoming.useQuery(
    { teamId: selectedTeam?.id },
    { enabled: !!selectedTeam }
  );
  
  if (isLoading) return <SessionsSkeleton />;
  
  if (!sessions?.length) {
    return (
      <EmptyState
        icon={Calendar}
        title="No upcoming sessions"
        description="Create your first session plan to get started"
        action={
          <Button onClick={() => router.push('/sessions/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Session
          </Button>
        }
      />
    );
  }
  
  return (
    <div className="space-y-4">
      <CardHeader>
        <CardTitle>Upcoming Sessions</CardTitle>
        <CardDescription>Next 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sessions.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      </CardContent>
    </div>
  );
}
```

### Quick Actions Widget
```typescript
// apps/web/src/components/dashboard/quick-actions.tsx
export function QuickActions() {
  const { selectedTeam } = useTeam();
  const router = useRouter();
  
  const actions = [
    {
      label: 'New Session',
      icon: CalendarPlus,
      onClick: () => router.push(`/sessions/new?team=${selectedTeam?.id}`),
      variant: 'default' as const,
    },
    {
      label: 'View Schedule',
      icon: Calendar,
      onClick: () => router.push('/schedule'),
    },
    {
      label: 'Team Roster',
      icon: Users,
      onClick: () => router.push(`/teams/${selectedTeam?.id}`),
    },
    {
      label: 'Drill Library',
      icon: Library,
      onClick: () => router.push('/drills'),
    },
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {actions.map(action => (
          <Button
            key={action.label}
            variant={action.variant || 'outline'}
            className="justify-start"
            onClick={action.onClick}
          >
            <action.icon className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
```

### Mobile Responsive Navigation
```typescript
// apps/web/src/components/layout/mobile-nav.tsx
export function MobileNav() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button
        variant="ghost"
        className="md:hidden"
        onClick={() => setOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>
      
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[240px]">
          <nav className="flex flex-col space-y-3">
            <TeamSelector />
            <Separator />
            <NavItems onClick={() => setOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
```

## Implementation Steps
1. Set up dashboard route structure
2. Create layout components
3. Implement team context
4. Build session components
5. Add quick actions
6. Create activity feed
7. Implement responsive design
8. Add loading states
9. Test on mobile devices

## Design Tokens
- Use consistent spacing: 4, 6, 8 units
- Card shadows: shadow-sm on desktop, none on mobile
- Breakpoints: sm(640), md(768), lg(1024)
- Max content width: 1280px
- Mobile padding: 16px

## Testing
- Team switching updates content
- Empty states display correctly  
- Mobile navigation works
- Quick actions navigate properly
- Sessions update in real-time
- Responsive at all breakpoints

## Notes
- Pre-fetch common routes
- Implement virtual scrolling for long lists
- Add keyboard shortcuts later
- Consider dark mode support