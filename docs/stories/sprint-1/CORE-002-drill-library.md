# CORE-002: Drill library with videos

**Type:** Core Feature  
**Points:** 5  
**Priority:** P1 (High)  
**Dependencies:** TECH-002  

## Description
Implement the drill library system that stores club-specific drills with YouTube video links. This library feeds into the AI session generation and allows coaches to build their own sessions.

## Acceptance Criteria
- [ ] Drill data model implemented
- [ ] CRUD operations for drills
- [ ] YouTube video validation
- [ ] Drill categorization (skill, age, etc.)
- [ ] Search and filter functionality
- [ ] Drill preview with video thumbnail
- [ ] Import/export capability
- [ ] Default drill library seeded
- [ ] Integration with AI planner

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

### YouTube Integration
```typescript
// apps/api/src/services/youtube.service.ts
export class YouTubeService {
  private youtube: youtube_v3.Youtube;
  
  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY
    });
  }
  
  async validateAndExtract(url: string): Promise<VideoMetadata> {
    const videoId = this.extractVideoId(url);
    if (!videoId) throw new Error('Invalid YouTube URL');
    
    const response = await this.youtube.videos.list({
      part: ['snippet', 'contentDetails'],
      id: [videoId]
    });
    
    const video = response.data.items?.[0];
    if (!video) throw new Error('Video not found');
    
    return {
      videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.high.url,
      duration: this.parseDuration(video.contentDetails.duration),
      isValid: true
    };
  }
  
  private extractVideoId(url: string): string | null {
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
}
```

### Drill Service
```typescript
// apps/api/src/services/drill.service.ts
export class DrillService {
  constructor(
    private db: PrismaClient,
    private youtube: YouTubeService
  ) {}
  
  async create(input: CreateDrillInput, userId: string): Promise<Drill> {
    // Validate video if provided
    let videoMetadata = null;
    if (input.videoUrl) {
      videoMetadata = await this.youtube.validateAndExtract(input.videoUrl);
    }
    
    return this.db.drill.create({
      data: {
        ...input,
        videoId: videoMetadata?.videoId,
        thumbnail: videoMetadata?.thumbnail,
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
2. Set up YouTube API integration
3. Build drill CRUD service
4. Implement search/filter logic
5. Create drill management UI
6. Add video preview component
7. Build import/export features
8. Seed default drill library
9. Integrate with session planner

## Default Drill Library
Include 50+ common drills covering:
- Technical skills (passing, dribbling, shooting)
- Tactical concepts (positioning, pressing)
- Physical development (agility, coordination)
- Fun games for younger ages
- Warm-up and cool-down activities

## Testing
- Video URL validation
- Search performance with large dataset
- Filter combinations work correctly
- Import handles duplicates
- Permissions enforced properly

## Notes
- Consider caching video thumbnails
- Plan for offline video support
- Monitor YouTube API quotas
- Allow custom video providers later