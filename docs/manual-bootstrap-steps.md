# Manual Bootstrap Steps

Since the Portainer API is returning 405 errors for stack creation, we need to create the initial stacks manually and then use the API for deployments.

## Step 1: Create Preview Stack Manually

1. Log into Portainer at: https://portainer.local.shaloo.io:9443
2. Go to **Stacks** → **Add Stack**
3. Name: `soccer-preview`
4. Build method: **Upload**
5. Upload the file: `docker-stack.preview.yml`
6. Add these environment variables:

```
IMAGE=ghcr.io/joshshaloo/soccer/project-unify:55c39cc
POSTGRES_USER=postgres
POSTGRES_PASSWORD=preview-password-CHANGE-ME
POSTGRES_DB=soccer
NEXTAUTH_SECRET=preview-secret-CHANGE-ME
NEXTAUTH_URL=https://preview.clubomatic.ai
OPENAI_API_KEY=sk-CHANGE-ME
N8N_USER=admin
N8N_PASSWORD=preview-n8n-password-CHANGE-ME
N8N_DB_NAME=n8n
EMAIL_FROM=noreply@preview.clubomatic.ai
SMTP_HOST=mailhog
SMTP_PORT=1025
SUPABASE_URL=https://CHANGE-ME.supabase.co
SUPABASE_ANON_KEY=CHANGE-ME
SUPABASE_SERVICE_ROLE_KEY=CHANGE-ME
```

7. Click **Deploy the stack**

## Step 2: Test Deployment

Once the stack is created manually, test the deployment:

```bash
make deploy-preview TAG=55c39cc
```

This should work because stack updates via API typically work even when creation doesn't.

## Step 3: Create Production Stack (Later)

Repeat the same process for production:

1. Name: `soccer-prod`
2. Upload: `docker-stack.prod.yml`
3. Set production environment variables
4. Test with: `make deploy-prod TAG=55c39cc`

## Notes

- The API creation might be disabled in this Portainer instance
- Stack updates (deployments) should work fine via API
- This is a one-time manual setup - all future deployments will be automated