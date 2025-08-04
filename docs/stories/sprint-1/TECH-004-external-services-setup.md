# TECH-004: External Services Setup

**Type:** Technical Foundation  
**Points:** 3  
**Priority:** P0 (Blocker)  
**Dependencies:** None (Must be first)  

## Description
Set up all external service accounts and API keys required for the MVP. This story ensures all third-party dependencies are configured and documented before any integration work begins.

## Acceptance Criteria
- [ ] Supabase project created and configured
- [ ] OpenAI API account and key obtained
- [ ] YouTube Data API v3 enabled and key obtained
- [ ] Environment variable template created
- [ ] Local MailHog configuration documented
- [ ] Service limits and quotas documented
- [ ] Fallback strategies defined
- [ ] Team access to credentials established

## Technical Details

### Required Services

1. **Supabase (Authentication & Database)**
   ```bash
   # Required environment variables
   NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
   SUPABASE_SERVICE_ROLE_KEY=[SERVICE_KEY]
   ```
   - Create new project
   - Enable Email Auth
   - Note connection pooler settings
   - Set up database access

2. **OpenAI API**
   ```bash
   OPENAI_API_KEY=sk-[API_KEY]
   OPENAI_MODEL=gpt-4-turbo-preview
   ```
   - Create API account
   - Add payment method
   - Set usage limits ($50/month for MVP)
   - Create project-specific key

3. **YouTube Data API v3**
   ```bash
   YOUTUBE_API_KEY=[API_KEY]
   ```
   - Enable API in Google Cloud Console
   - Create API key with restrictions
   - Set quota alerts (10,000 units/day)
   - Restrict to specific APIs

4. **Email Service (Local Development)**
   ```yaml
   # docker-compose.dev.yml addition
   mailhog:
     image: mailhog/mailhog
     ports:
       - "1025:1025" # SMTP
       - "8025:8025" # Web UI
   ```

### Environment Template (.env.example)
```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/soccer"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-key"

# OpenAI
OPENAI_API_KEY="sk-your-api-key"
OPENAI_MODEL="gpt-4-turbo-preview"

# YouTube
YOUTUBE_API_KEY="your-youtube-key"

# Email (Development)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_FROM="noreply@soccer-platform.local"

# n8n (Future)
N8N_WEBHOOK_URL="http://localhost:5678/webhook"
```

### Service Limits Documentation
```markdown
## API Quotas and Limits

### OpenAI
- Model: GPT-4 Turbo
- Rate limit: 10,000 TPM (tokens per minute)
- Monthly budget: $50
- Fallback: Queue requests or use GPT-3.5

### YouTube Data API
- Daily quota: 10,000 units
- Search cost: 100 units per request
- Video details: 1 unit per video
- Strategy: Cache results for 24 hours

### Supabase (Free Tier)
- Database: 500MB
- Auth users: Unlimited
- API requests: 2GB bandwidth
- File storage: 1GB
```

## Implementation Steps
1. Create Supabase project
2. Set up OpenAI account and billing
3. Configure Google Cloud project
4. Enable YouTube Data API
5. Create API keys with proper restrictions
6. Document all credentials securely
7. Create .env.example file
8. Update setup documentation
9. Test all API connections

## Testing
- [ ] Supabase connection test script
- [ ] OpenAI API key validation
- [ ] YouTube API quota check
- [ ] Email sending via MailHog
- [ ] Environment variable validation script

## Security Considerations
- [ ] API keys stored in password manager
- [ ] Keys restricted by IP/domain where possible
- [ ] Service accounts use minimum permissions
- [ ] Rotation schedule documented
- [ ] No keys in git repository

## Fallback Strategies
1. **OpenAI Unavailable**
   - Queue requests for retry
   - Show "AI temporarily unavailable" message
   - Provide manual session planning option

2. **YouTube Quota Exceeded**
   - Use cached drill videos
   - Show static drill descriptions
   - Reset at midnight Pacific

3. **Supabase Outage**
   - Local auth not possible
   - Show maintenance page
   - Monitor status page

## Notes
- Store credentials in team password manager
- Set up billing alerts for all services
- Document setup in team wiki
- Create monitoring dashboard for quotas