# Bootstrap Checklist

## Prerequisites

- [ ] Access to Portainer instance
- [ ] Portainer API token created
- [ ] Tailscale VPN connected (if accessing remotely)
- [ ] Docker images built and available in GitHub Container Registry

## Step 1: Configure Environment

```bash
# Edit .env file and add your Portainer credentials
# Look for the Portainer API Configuration section
vi .env

# Then source the environment variables
source .env
```

## Step 2: Run Bootstrap

```bash
# Use the interactive script
./scripts/bootstrap.sh

# Or run directly:
make bootstrap-preview   # For preview environment
make bootstrap-prod     # For production (requires confirmation)
```

## Step 3: Configure Secrets in Portainer

### Preview Environment Variables

1. Log into Portainer
2. Navigate to Stacks → soccer-preview
3. Update these variables:

- [ ] `POSTGRES_PASSWORD` - Change from default
- [ ] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `OPENAI_API_KEY` - Your OpenAI API key
- [ ] `N8N_PASSWORD` - Secure password for n8n admin
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_ANON_KEY` - Your Supabase anon key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key

### Production Environment Variables

Same as preview, plus:

- [ ] `SMTP_HOST` - Your SMTP server
- [ ] `SMTP_PORT` - Usually 587
- [ ] `SMTP_USER` - SMTP username
- [ ] `SMTP_PASSWORD` - SMTP password
- [ ] `EMAIL_FROM` - From email address

## Step 4: Verify Deployment

### Check Services

```bash
# Check if stacks are running
curl -H "X-API-Key: $PORTAINER_API_KEY" \
  $PORTAINER_HOST/api/stacks | jq '.[].Name'

# Should see:
# "soccer-preview"
# "soccer-prod" (if bootstrapped)
```

### Test Access

Preview:
- [ ] App: https://preview.clubomatic.ai
- [ ] n8n: https://preview-n8n.clubomatic.ai
- [ ] MailHog: http://172.20.0.22:8125 (Tailnet only)
- [ ] PostgreSQL: `psql -h 172.20.0.22 -p 5435 -U postgres soccer`

Production:
- [ ] App: https://app.clubomatic.ai
- [ ] n8n: https://n8n.clubomatic.ai
- [ ] PostgreSQL: `psql -h 172.20.0.22 -p 5434 -U postgres soccer`

## Step 5: Initial Database Setup

```bash
# Connect to preview database
psql -h 172.20.0.22 -p 5435 -U postgres soccer

# Run migrations (from local machine)
DATABASE_URL="postgresql://postgres:your-password@172.20.0.22:5435/soccer" \
  pnpm --filter @soccer/web db:push

# Seed with test data (optional)
DATABASE_URL="postgresql://postgres:your-password@172.20.0.22:5435/soccer" \
  pnpm --filter @soccer/web db:seed
```

## Troubleshooting

### Bootstrap Fails

1. Check Portainer is accessible:
   ```bash
   curl -H "X-API-Key: $PORTAINER_API_KEY" $PORTAINER_HOST/api/status
   ```

2. Verify API key is valid
3. Check if stack name already exists

### Services Not Starting

1. Check logs in Portainer UI
2. Verify all required environment variables are set
3. Check volume mount paths exist on host

### Cannot Access Services

1. Verify Cloudflare Tunnel is active
2. Check Docker services are running
3. Review firewall rules

## Next Steps

After successful bootstrap:

1. Set up GitHub secrets for CI/CD
2. Configure branch protection rules
3. Test deployment pipeline with a PR