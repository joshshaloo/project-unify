# INFRA-002: Monitoring & Logging Setup

**Type:** Infrastructure  
**Points:** 3  
**Priority:** P1 (High)  
**Dependencies:** TECH-003  

## Description
Implement basic monitoring and logging infrastructure to track application health, errors, and performance. This ensures we can identify and resolve issues quickly in production.

## Acceptance Criteria
- [ ] Error tracking service configured
- [ ] Application logs aggregated and searchable
- [ ] Basic performance monitoring active
- [ ] Health check endpoints implemented
- [ ] Alerts configured for critical issues
- [ ] Dashboard showing key metrics
- [ ] Log retention policy defined
- [ ] Documentation for accessing logs

## Technical Details

### Error Tracking (Sentry Self-Hosted)
```yaml
# docker-stack.monitoring.yml
version: '3.8'

services:
  sentry-postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sentry
      POSTGRES_USER: sentry
      POSTGRES_PASSWORD: ${SENTRY_DB_PASSWORD}
    volumes:
      - sentry_postgres:/var/lib/postgresql/data

  sentry-redis:
    image: redis:7-alpine
    volumes:
      - sentry_redis:/data

  sentry-web:
    image: getsentry/sentry:latest
    environment:
      SENTRY_SECRET_KEY: ${SENTRY_SECRET_KEY}
      SENTRY_DB_NAME: sentry
      SENTRY_DB_USER: sentry
      SENTRY_DB_PASSWORD: ${SENTRY_DB_PASSWORD}
      SENTRY_POSTGRES_HOST: sentry-postgres
      SENTRY_REDIS_HOST: sentry-redis
    depends_on:
      - sentry-postgres
      - sentry-redis
    ports:
      - "9000:9000"
```

### Application Integration
```typescript
// apps/web/src/lib/monitoring.ts
import * as Sentry from "@sentry/nextjs";

export function initMonitoring() {
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.DEPLOYMENT_ENV,
      tracesSampleRate: 0.1,
      beforeSend(event, hint) {
        // Filter out sensitive data
        if (event.request?.cookies) {
          delete event.request.cookies;
        }
        return event;
      },
    });
  }
}

// Error boundary component
export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <ErrorFallback error={error} resetError={resetError} />
      )}
      showDialog
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
```

### Logging Strategy
```typescript
// apps/web/src/lib/logger.ts
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'UTC:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
  redact: ['password', 'token', 'apiKey'],
});

export const log = {
  info: (msg: string, data?: any) => logger.info(data, msg),
  error: (msg: string, error?: any) => logger.error(error, msg),
  warn: (msg: string, data?: any) => logger.warn(data, msg),
  debug: (msg: string, data?: any) => logger.debug(data, msg),
};

// tRPC integration
export const loggerMiddleware = middleware(async ({ path, type, next, ctx }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;
  
  log.info(`${type} ${path}`, {
    duration,
    userId: ctx.session?.user?.id,
    success: result.ok,
  });
  
  return result;
});
```

### Health Checks
```typescript
// apps/web/src/app/api/health/route.ts
export async function GET() {
  const checks = {
    app: 'ok',
    database: 'unknown',
    redis: 'unknown',
    n8n: 'unknown',
  };
  
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (error) {
    checks.database = 'error';
  }
  
  try {
    // Check Redis
    await redis.ping();
    checks.redis = 'ok';
  } catch (error) {
    checks.redis = 'error';
  }
  
  try {
    // Check n8n
    const response = await fetch(`${process.env.N8N_URL}/healthz`);
    checks.n8n = response.ok ? 'ok' : 'error';
  } catch (error) {
    checks.n8n = 'error';
  }
  
  const allHealthy = Object.values(checks).every(status => status === 'ok');
  
  return Response.json(checks, {
    status: allHealthy ? 200 : 503,
  });
}
```

### Metrics Collection
```typescript
// apps/web/src/lib/metrics.ts
export const metrics = {
  // API metrics
  apiRequestDuration: new Histogram({
    name: 'api_request_duration_seconds',
    help: 'API request duration in seconds',
    labelNames: ['method', 'route', 'status'],
  }),
  
  // Business metrics
  sessionsCreated: new Counter({
    name: 'sessions_created_total',
    help: 'Total number of sessions created',
    labelNames: ['team_id'],
  }),
  
  activeUsers: new Gauge({
    name: 'active_users',
    help: 'Number of active users',
  }),
};
```

### Alert Configuration
```yaml
# Portainer alerts
alerts:
  - name: High Error Rate
    condition: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
    action: email
    
  - name: Database Connection Failed
    condition: health_check{component="database"} == 0
    action: webhook
    
  - name: Low Disk Space
    condition: disk_free_percent < 10
    action: email
    
  - name: High Memory Usage
    condition: memory_usage_percent > 90
    action: email
```

### Simple Monitoring Dashboard
```typescript
// apps/web/src/app/(app)/admin/monitoring/page.tsx
export default async function MonitoringPage() {
  const metrics = await getMetrics();
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Error Rate"
        value={metrics.errorRate}
        format="percentage"
        threshold={5}
      />
      <MetricCard
        title="Active Users"
        value={metrics.activeUsers}
        format="number"
      />
      <MetricCard
        title="API Response Time"
        value={metrics.avgResponseTime}
        format="duration"
        threshold={1000}
      />
      <MetricCard
        title="System Health"
        value={metrics.healthScore}
        format="percentage"
        threshold={95}
      />
    </div>
  );
}
```

## Implementation Steps
1. Deploy Sentry container
2. Configure Sentry in Next.js
3. Add structured logging
4. Implement health checks
5. Create metrics collection
6. Set up log aggregation
7. Configure alerts
8. Build monitoring dashboard
9. Document access procedures

## Testing
- Trigger test errors and verify capture
- Check log aggregation working
- Test health endpoint responses
- Verify metrics collection
- Test alert notifications
- Load test monitoring overhead

## Log Retention Policy
- Application logs: 30 days
- Error details: 90 days
- Performance metrics: 30 days
- Audit logs: 1 year

## Notes
- Start with Sentry for errors
- Add Prometheus/Grafana later
- Consider Elastic Stack for logs
- Keep monitoring lightweight
- Focus on actionable metrics