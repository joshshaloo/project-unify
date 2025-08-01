# UI-002: Session plan viewer

**Type:** User Interface  
**Points:** 3  
**Priority:** P1 (High)  
**Dependencies:** CORE-001, UI-001  

## Description
Create the session plan viewer that displays AI-generated or manually created session plans in a clear, printable format. Support both read-only viewing and inline editing modes.

## Acceptance Criteria
- [ ] Session plan display with all components
- [ ] Drill cards with video thumbnails  
- [ ] Timeline visualization
- [ ] Coaching points prominently displayed
- [ ] Print-friendly layout
- [ ] Share functionality
- [ ] Edit mode toggle
- [ ] Mobile optimized view
- [ ] Export to PDF option

## Technical Details

### Session Viewer Layout
```typescript
// apps/web/src/app/(app)/sessions/[id]/page.tsx
export default async function SessionPage({ params }: Props) {
  return (
    <SessionProvider sessionId={params.id}>
      <div className="container max-w-4xl">
        <SessionHeader />
        <SessionTimeline />
        <div className="space-y-6 mt-8">
          <WarmUpSection />
          <MainActivitiesSection />
          <CoolDownSection />
        </div>
        <SessionFooter />
      </div>
    </SessionProvider>
  );
}
```

### Session Header Component
```typescript
// apps/web/src/components/session/session-header.tsx
export function SessionHeader() {
  const { session, isEditing, setIsEditing } = useSession();
  const { user } = useAuth();
  
  const canEdit = user.id === session.createdBy || 
                  user.role === 'head_coach';
  
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold">{session.theme}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {format(session.date, 'PPP')}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {session.duration} minutes
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {session.team.name}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2">
        {canEdit && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? 'Save' : 'Edit'}
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Export PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
```

### Drill Card Component
```typescript
// apps/web/src/components/session/drill-card.tsx
export function DrillCard({ drill, index, isEditing }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {drill.duration} min
              </Badge>
              <h3 className="font-semibold">{drill.name}</h3>
            </div>
            
            {drill.videoUrl && (
              <div className="relative aspect-video w-full max-w-xs mb-3">
                <Image
                  src={drill.thumbnail}
                  alt={drill.name}
                  fill
                  className="object-cover rounded"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <PlayCircle className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
              </div>
            )}
            
            <p className="text-sm text-muted-foreground mb-3">
              {drill.description}
            </p>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium mb-1">Setup</h4>
                <p className="text-sm text-muted-foreground">{drill.setup}</p>
              </div>
              
              <Collapsible open={expanded} onOpenChange={setExpanded}>
                <CollapsibleContent>
                  <div className="space-y-3 pt-3">
                    <div>
                      <h4 className="text-sm font-medium mb-1">Instructions</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {drill.instructions.map((instruction, i) => (
                          <li key={i} className="flex gap-2">
                            <span>{i + 1}.</span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-1">Coaching Points</h4>
                      <ul className="text-sm space-y-1">
                        {drill.coachingPoints.map((point, i) => (
                          <li key={i} className="flex gap-2">
                            <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
                
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="mt-2">
                    {expanded ? 'Show less' : 'Show more'}
                    <ChevronDown className={cn(
                      "ml-2 h-4 w-4 transition-transform",
                      expanded && "rotate-180"
                    )} />
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex flex-col gap-1 ml-2">
              <Button size="icon" variant="ghost" onClick={handleMoveUp}>
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleMoveDown}>
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={handleRemove}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
```

### Print Styles
```css
/* apps/web/src/styles/print.css */
@media print {
  .no-print {
    display: none !important;
  }
  
  .session-viewer {
    max-width: 100%;
    margin: 0;
    padding: 20px;
  }
  
  .drill-card {
    break-inside: avoid;
    page-break-inside: avoid;
    margin-bottom: 20px;
  }
  
  .video-thumbnail {
    max-width: 200px;
    height: auto;
  }
  
  /* Force coaching points to be visible */
  .collapsible-content {
    display: block !important;
    height: auto !important;
  }
}
```

## Implementation Steps
1. Create session viewer route
2. Build layout components
3. Implement drill cards
4. Add timeline visualization
5. Create edit mode functionality
6. Implement print styles
7. Add PDF export
8. Build share dialog
9. Test responsive design

## Mobile Optimizations
- Stack header elements vertically
- Collapse drill details by default
- Swipe gestures for navigation
- Simplified timeline on small screens
- Touch-friendly action buttons

## Testing
- Session loads with all data
- Edit mode saves changes
- Print layout works correctly
- PDF export includes all content
- Share generates correct links
- Mobile view is usable

## Notes
- Pre-render for better performance
- Cache generated PDFs
- Track view analytics
- Add offline support later