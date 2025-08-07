import { z } from 'zod';

// Schema for n8n Coach Winston API request
const coachWinstonRequestSchema = z.object({
  teamId: z.string(),
  duration: z.number().min(15).max(120),
  focusAreas: z.array(z.string()),
  ageGroup: z.string().optional(),
  skillLevel: z.string().optional(),
  playerCount: z.number().optional(),
  weatherConditions: z.string().optional(),
  availableEquipment: z.array(z.string()).optional(),
});

// Schema for n8n Coach Winston API response
const coachWinstonResponseSchema = z.object({
  success: z.boolean(),
  sessionId: z.string().optional(),
  sessionPlan: z.object({
    sessionTitle: z.string(),
    overview: z.string(),
    totalDuration: z.number(),
    ageGroup: z.string(),
    focusAreas: z.array(z.string()),
    activities: z.array(z.object({
      phase: z.enum(['warm-up', 'technical', 'tactical', 'game', 'cool-down']),
      name: z.string(),
      duration: z.number(),
      description: z.string(),
      setup: z.string().optional(),
      instructions: z.string(),
      coachingPoints: z.array(z.string()).optional(),
      progressions: z.array(z.string()).optional(),
      equipment: z.array(z.string()).optional(),
      safetyNotes: z.string().optional(),
    })),
    coachNotes: z.string().optional(),
    adaptations: z.object({
      forBeginners: z.string().optional(),
      forAdvanced: z.string().optional(),
      weatherAlternatives: z.string().optional(),
    }).optional(),
  }).optional(),
  metadata: z.object({
    generatedAt: z.string(),
    teamId: z.string(),
    requestId: z.string(),
  }).optional(),
  error: z.object({
    message: z.string(),
    code: z.string(),
    timestamp: z.string(),
    requestId: z.string(),
  }).optional(),
});

export type CoachWinstonRequest = z.infer<typeof coachWinstonRequestSchema>;
export type CoachWinstonResponse = z.infer<typeof coachWinstonResponseSchema>;

export class N8NClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor() {
    // Make webhook URL optional during build time
    const webhookUrl = process.env.N8N_WEBHOOK_URL || '';
    this.baseUrl = webhookUrl;
    this.timeout = 30000; // 30 seconds
  }

  private ensureConfigured() {
    if (!this.baseUrl) {
      throw new Error('N8N_WEBHOOK_URL environment variable is required');
    }
  }

  /**
   * Generate a training session using Coach Winston n8n workflow
   */
  async generateSession(request: CoachWinstonRequest): Promise<CoachWinstonResponse> {
    this.ensureConfigured();
    
    // Validate request
    const validatedRequest = coachWinstonRequestSchema.parse(request);

    try {
      const response = await fetch(`${this.baseUrl}/webhook/coach-winston`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedRequest),
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`n8n API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate response
      const validatedResponse = coachWinstonResponseSchema.parse(data);

      if (!validatedResponse.success) {
        throw new Error(validatedResponse.error?.message || 'Session generation failed');
      }

      return validatedResponse;
    } catch (error) {
      console.error('N8N Client Error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          throw new Error('Session generation timed out. Please try again.');
        }
        if (error.message.includes('404')) {
          throw new Error('Coach Winston workflow is not available. Please check the n8n configuration.');
        }
        if (error.message.includes('network') || error.message.includes('fetch')) {
          throw new Error('Unable to connect to AI service. Please try again later.');
        }
      }
      
      throw error;
    }
  }

  /**
   * Check if n8n service is healthy
   */
  async healthCheck(): Promise<boolean> {
    this.ensureConfigured();
    
    try {
      const response = await fetch(`${this.baseUrl}/webhook/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const n8nClient = new N8NClient();