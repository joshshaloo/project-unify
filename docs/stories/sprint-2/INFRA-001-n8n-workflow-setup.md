# INFRA-001: n8n Workflow Setup

**Type:** Infrastructure  
**Points:** 5  
**Priority:** P0 (Blocker for AI features)  
**Dependencies:** TECH-002, TECH-003  

## Description
Set up n8n workflow automation platform in Docker container to enable AI agent orchestration. This provides the visual workflow interface for connecting our 5 AI agents with the OpenAI API and our application.

## Acceptance Criteria
- [ ] n8n container running in Docker Swarm
- [ ] Persistent volume for workflow storage
- [ ] Webhook endpoints accessible from application
- [ ] Basic authentication configured
- [ ] PostgreSQL node connected to app database
- [ ] OpenAI node configured and tested
- [ ] Email node connected to SMTP service
- [ ] Basic agent workflow templates created
- [ ] Monitoring and logs accessible

## Technical Details

### Docker Stack Configuration
```yaml
# docker-stack.n8n.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD}
      - N8N_HOST=n8n.soccer-platform.local
      - N8N_PORT=5678
      - N8N_WEBHOOK_URL=https://n8n.soccer-platform.com/
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=${N8N_DB_PASSWORD}
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - soccer_network
    ports:
      - "5678:5678"
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager

volumes:
  n8n_data:
    driver: local
```

### Agent Webhook Endpoints
```typescript
// Webhook URL structure
const N8N_WEBHOOKS = {
  sessionPlanning: `${N8N_BASE_URL}/webhook/coach-winston`,
  playerAnalysis: `${N8N_BASE_URL}/webhook/scout-emma`,
  healthCheck: `${N8N_BASE_URL}/webhook/physio-alex`,
  motivation: `${N8N_BASE_URL}/webhook/motivator-sam`,
  analytics: `${N8N_BASE_URL}/webhook/analyst-jordan`,
};
```

### Base Workflow Template (Coach Winston)
```json
{
  "name": "Coach Winston - Session Planning",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "coach-winston",
        "responseMode": "onReceived",
        "options": {}
      }
    },
    {
      "name": "Extract Parameters",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            {
              "name": "teamId",
              "value": "={{$json[\"teamId\"]}}"
            },
            {
              "name": "sessionDate",
              "value": "={{$json[\"sessionDate\"]}}"
            }
          ]
        }
      }
    },
    {
      "name": "Get Team Context",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM teams WHERE id = $1",
        "additionalFields": {
          "queryParams": "={{$json[\"teamId\"]}}"
        }
      }
    },
    {
      "name": "OpenAI GPT-4",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "text",
        "operation": "complete",
        "model": "gpt-4-turbo-preview",
        "prompt": "Generate soccer training session...",
        "maxTokens": 2000
      }
    },
    {
      "name": "Store Session",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "INSERT INTO sessions ..."
      }
    },
    {
      "name": "Return Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "parameters": {
        "responseMode": "lastNode",
        "responseData": "={{$json}}"
      }
    }
  ]
}
```

### Application Integration
```typescript
// apps/web/src/lib/n8n/client.ts
export class N8nClient {
  private baseUrl: string;
  
  constructor() {
    this.baseUrl = process.env.N8N_WEBHOOK_URL!;
  }
  
  async triggerWorkflow(workflow: string, data: any) {
    const response = await fetch(`${this.baseUrl}/webhook/${workflow}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`Workflow failed: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  async generateSession(teamId: string, date: string) {
    return this.triggerWorkflow('coach-winston', {
      teamId,
      sessionDate: date,
      context: await this.getTeamContext(teamId),
    });
  }
}
```

## Implementation Steps
1. Add n8n to Docker stack
2. Create n8n database and user
3. Deploy n8n container
4. Configure Cloudflare tunnel
5. Set up basic authentication
6. Create workflow templates
7. Test webhook endpoints
8. Integrate with application
9. Add monitoring alerts

## Testing
- [ ] Webhook endpoints respond to POST requests
- [ ] Workflows execute without errors
- [ ] OpenAI integration returns valid responses
- [ ] Database operations complete successfully
- [ ] Error handling works correctly
- [ ] Performance under load (10 req/min)

## Monitoring
- Workflow execution logs
- Error rates by workflow
- OpenAI token usage
- Response times
- Database query performance

## Security Considerations
- Webhook URLs use authentication tokens
- n8n interface behind basic auth
- Database uses separate user with limited permissions
- API keys stored as n8n credentials
- Workflow access logged

## Notes
- Start with Coach Winston workflow
- Other agents can be added incrementally
- Consider n8n cloud for production later
- Set up workflow versioning
- Document each workflow purpose