# CORE-002: Drill library with videos

**Type:** Core Feature  
**Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** TECH-002  

## Description
Implement the drill library system that stores club-specific drills. For MVP, support text-based drills with video URL storage for future integration. This library feeds into the AI session generation and allows coaches to build their own sessions.

## Acceptance Criteria
- [ ] Drill data model implemented
- [ ] CRUD operations for drills
- [ ] Video URL storage (validation deferred)
- [ ] Drill categorization (skill, age, etc.)
- [ ] Search and filter functionality
- [ ] Basic drill list view
- [ ] Import capability from JSON
- [ ] Default drill library seeded (50+ drills)
- [ ] API ready for AI integration

## Technical Details

### Data Model
```prisma
model Drill {
  id            String   @id @default(cuid())
  clubId        String?  // Null for default drills
  name          String
  description   String
  category      DrillCategory
  skillFocus    String[]
  ageGroups     String[]
  duration      Int      // minutes
  playersMin    Int
  playersMax    Int
  
  // YouTube Integration
  videoUrl      String?
  videoId       String?
  thumbnail     String?
  
  // Content
  setup         String
  instructions  String[]
  coachingPoints String[]
  variations    String[]
  
  // Metadata
  difficulty    Int      @default(3) // 1-5
  equipment     String[]
  space         String   // "small", "medium", "large"
  
  createdAt     DateTime @default(now())
  createdBy     String
  isActive      Boolean  @default(true)
  
  club          Club?    @relation(fields: [clubId], references: [id])
  sessionDrills SessionDrill[]
  
  @@index([clubId, category])
  @@index([skillFocus])
}
```

### Simplified Video URL Storage (MVP)
```typescript
// apps/web/src/lib/utils/video.ts
export function extractVideoId(url: string): string | null {
  if (!url) return null;
  
  // Basic YouTube URL patterns - no API validation for MVP
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function getYouTubeThumbnail(videoId: string): string {
  // YouTube provides predictable thumbnail URLs
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
```

### Drill Service (Simplified for MVP)
```typescript
// apps/web/src/lib/services/drill.service.ts
export class DrillService {
  constructor(private db: PrismaClient) {}
  
  async create(input: CreateDrillInput, userId: string, clubId: string): Promise<Drill> {
    // Extract video ID if URL provided (no validation for MVP)
    const videoId = input.videoUrl ? extractVideoId(input.videoUrl) : null;
    
    return this.db.drill.create({
      data: {
        ...input,
        clubId,
        videoId,
        thumbnail: videoId ? getYouTubeThumbnail(videoId) : null,
        createdBy: userId
      }
    });
  }
  
  async search(filters: DrillFilters): Promise<Drill[]> {
    const where: Prisma.DrillWhereInput = {
      isActive: true,
      clubId: { in: [filters.clubId, null] }, // Club + default drills
    };
    
    if (filters.category) {
      where.category = filters.category;
    }
    
    if (filters.ageGroup) {
      where.ageGroups = { has: filters.ageGroup };
    }
    
    if (filters.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: 'insensitive' } },
        { description: { contains: filters.searchTerm, mode: 'insensitive' } },
        { skillFocus: { hasSome: [filters.searchTerm] } }
      ];
    }
    
    return this.db.drill.findMany({
      where,
      orderBy: [
        { clubId: 'desc' }, // Prioritize club drills
        { name: 'asc' }
      ]
    });
  }
}
```

### API Endpoints
```typescript
export const drillRouter = router({
  list: protectedProcedure
    .input(drillFilterSchema)
    .query(async ({ input, ctx }) => {
      return ctx.drillService.search({
        ...input,
        clubId: ctx.user.clubId
      });
    }),
    
  create: protectedProcedure
    .input(createDrillSchema)
    .mutation(async ({ input, ctx }) => {
      await checkPermission(ctx.user, 'drills.create');
      return ctx.drillService.create(input, ctx.user.id);
    }),
    
  import: protectedProcedure
    .input(z.object({
      drills: z.array(drillImportSchema)
    }))
    .mutation(async ({ input, ctx }) => {
      await checkPermission(ctx.user, 'drills.import');
      return ctx.drillService.bulkImport(input.drills, ctx.user.clubId);
    })
});
```

## Implementation Steps
1. Create drill database schema
2. Build drill CRUD service
3. Implement search/filter logic
4. Create basic drill list UI
5. Add drill detail view
6. Build JSON import feature
7. Seed default drill library
8. Create API endpoints for AI

## Default Drill Library
Include 50+ common drills covering:
- Technical skills (passing, dribbling, shooting)
- Tactical concepts (positioning, pressing)
- Physical development (agility, coordination)
- Fun games for younger ages
- Warm-up and cool-down activities

## Testing
- Basic URL pattern matching works
- Search performance with 50+ drills
- Filter combinations work correctly
- Import handles duplicates gracefully
- Drill creation saves video URLs

## UI Components (Simplified)
```typescript
// Drill list view - text focus for MVP
export function DrillList({ drills }: { drills: Drill[] }) {
  return (
    <div className="space-y-4">
      {drills.map(drill => (
        <Card key={drill.id}>
          <CardHeader>
            <CardTitle>{drill.name}</CardTitle>
            <Badge>{drill.category}</Badge>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {drill.description}
            </p>
            <div className="mt-2 flex gap-2">
              <Badge variant="outline">{drill.ageGroups.join(', ')}</Badge>
              <Badge variant="outline">{drill.duration} min</Badge>
              {drill.videoUrl && (
                <Badge variant="outline">
                  <Video className="w-3 h-3 mr-1" />
                  Video
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

## Notes
- YouTube API integration deferred to Sprint 2
- Video preview/validation in future sprint
- Focus on text content and structure
- Video URLs stored but not validated