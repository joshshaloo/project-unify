# CORE-001: Basic AI session generation

**Type:** Core Feature  
**Points:** 8  
**Priority:** P0 (Blocker)  
**Dependencies:** TECH-002, AUTH-002  
**Status:** In Progress  

## Description
Implement the core AI Planning Engine that generates training session plans based on club curriculum, team details, and coach input. This is the primary value proposition of the platform.

## Acceptance Criteria
- [ ] AI service integrated with OpenAI GPT-4
- [ ] Session generation API endpoint
- [ ] Curriculum context loading
- [ ] Age-appropriate drill selection
- [ ] Session structure generation (warm-up, main, cool-down)
- [ ] Coaching points included
- [ ] Response time under 30 seconds
- [ ] Error handling and fallbacks
- [ ] Generated plans are editable

## Technical Details

### AI Service Architecture
```typescript
// apps/api/src/services/ai-planning.service.ts
export class AIPlanningService {
  constructor(
    private openai: OpenAI,
    private db: PrismaClient,
    private drillService: DrillService
  ) {}

  async generateSessionPlan(input: GenerateSessionInput): Promise<SessionPlan> {
    // Load context
    const context = await this.loadContext(input);
    
    // Build prompt
    const prompt = this.buildPrompt(context);
    
    // Generate with GPT-4
    const completion = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });
    
    // Parse and validate response
    const plan = this.parseAIResponse(completion);
    
    // Enhance with drill details
    const enhanced = await this.enhancePlan(plan);
    
    return enhanced;
  }
  
  private async loadContext(input: GenerateSessionInput) {
    const [team, curriculum, recentSessions] = await Promise.all([
      this.db.team.findUnique({
        where: { id: input.teamId },
        include: { players: true }
      }),
      this.loadCurriculum(input.teamId),
      this.getRecentSessions(input.teamId, 5)
    ]);
    
    return {
      team,
      curriculum,
      recentSessions,
      coachInput: input.context,
      constraints: input.constraints
    };
  }
}
```

### Prompt Engineering
```typescript
const SYSTEM_PROMPT = `You are an expert youth soccer coach and session planner. 
Generate training sessions that:
- Follow the provided curriculum guidelines
- Are age-appropriate and engaging
- Progress logically through warm-up, main activities, and cool-down
- Include clear coaching points for each drill
- Adapt to team size and skill level
- Incorporate recent performance feedback when provided

Return a structured JSON response with:
{
  "theme": "Session theme/focus",
  "objectives": ["objective1", "objective2"],
  "warmUp": {
    "duration": 15,
    "activities": [...]
  },
  "mainActivities": {
    "duration": 60,
    "activities": [...]
  },
  "coolDown": {
    "duration": 10,
    "activities": [...]
  }
}`;
```

### API Endpoint
```typescript
// apps/api/src/routers/session.ts
export const sessionRouter = router({
  generateWithAI: protectedProcedure
    .input(z.object({
      teamId: z.string(),
      date: z.string(),
      duration: z.number().min(30).max(120),
      context: z.object({
        recentPerformance: z.string().optional(),
        focusAreas: z.array(z.string()).optional(),
        constraints: z.array(z.string()).optional(),
      }).optional()
    }))
    .mutation(async ({ input, ctx }) => {
      // Check permissions
      await checkTeamAccess(ctx.user.id, input.teamId);
      
      // Queue generation job
      const job = await ctx.queue.send('generate-session', {
        ...input,
        userId: ctx.user.id
      });
      
      return { 
        jobId: job.id,
        status: 'processing' 
      };
    }),
});
```

## Implementation Steps
1. Set up OpenAI client
2. Design prompt templates
3. Implement context loading
4. Create generation service
5. Add queueing for async processing
6. Build response parser/validator
7. Implement drill enhancement
8. Add fallback templates
9. Create generation UI
10. Test with various inputs

## Error Handling
- OpenAI API failures → fallback to templates
- Invalid AI response → retry with refined prompt
- Timeout (>30s) → return partial result
- Rate limiting → queue management
- Context loading fails → use defaults

## Testing
- Generate plans for different age groups
- Verify curriculum alignment
- Test with various coach inputs
- Measure generation times
- Validate drill appropriateness
- Test error scenarios

## Performance Optimization
- Cache curriculum data
- Pre-load common drills
- Stream AI responses
- Background processing
- Result caching for similar inputs

## Notes
- Monitor OpenAI API costs
- A/B test different prompts
- Collect coach feedback on quality
- Plan for fine-tuning option
- Consider fallback to GPT-3.5 for cost

## Dev Agent Record

### Agent Model Used
- Claude Opus 4

### Implementation Progress

#### n8n Workflow Implementation (Completed)
- ✅ Created Coach Winston workflow in n8n (Workflow ID: uRB4YeJC6UWqm98H)
- ✅ Webhook endpoint configured: https://n8n.shaloo.io/webhook/coach-winston
- ✅ Input validation with comprehensive error handling
- ✅ Context retrieval from Supabase (teams table + session history)
- ✅ Coach Winston personality and prompt engineering implemented
- ✅ OpenAI GPT-4 integration with structured JSON output
- ✅ Session storage in Supabase training_sessions table
- ✅ Proper error responses for Next.js integration

#### Next.js Integration (Completed)
- ✅ Create tRPC endpoint to call n8n webhook
- ✅ Modified existing generateSession procedure in aiRouter
- ✅ Added n8n client service with request/response validation
- ✅ Implemented fallback to direct OpenAI when n8n unavailable
- ✅ Added environment variable configuration
- [ ] Add session generation UI component
- [ ] Implement loading states and error handling
- [ ] Add session editing capabilities

### Debug Log References
- n8n workflow created successfully with ID: uRB4YeJC6UWqm98H
- Webhook URL: https://n8n.shaloo.io/webhook/coach-winston
- Required Supabase tables: teams, training_sessions

### Completion Notes
- n8n workflow follows the Base Agent Template pattern from architecture
- Coach Winston personality includes 20+ years experience, player development focus
- Structured JSON response format defined for Next.js integration
- Error handling includes validation, API failures, and database errors

### File List
- Modified: /docs/stories/sprint-1/CORE-001-ai-session-generation.md
- Created: /apps/web/src/lib/ai/n8n-client.ts
- Modified: /apps/web/src/lib/trpc/routers/ai.ts
- Modified: /apps/web/.env.example
- Modified: /apps/web/.env.local
- n8n Workflow: Coach Winston (ID: uRB4YeJC6UWqm98H) - external system

### Change Log
- 2025-08-02: Created Coach Winston n8n workflow for AI session generation
- 2025-08-02: Configured webhook endpoint and error handling
- 2025-08-02: Defined API contract for Next.js integration
- 2025-08-02: Implemented Next.js tRPC integration with n8n client
- 2025-08-02: Added fallback mechanism to direct OpenAI when n8n unavailable
- 2025-08-02: All TypeScript compilation passes