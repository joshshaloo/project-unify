# Bootstrap Test Instructions

If bootstrap is failing with network errors, you can manually create the stack in Portainer:

## Manual Bootstrap Steps:

1. **Create the Docker secrets in Portainer:**
   - `soccer_preview_postgres_password`
   - `soccer_preview_nextauth_secret`
   - `soccer_preview_n8n_password`

2. **Create the stack in Portainer:**
   - Stack name: `soccer-preview`
   - Use the content from `docker-stack.preview.yml`
   - Set the environment variable: `IMAGE=ghcr.io/joshshaloo/soccer/project-unify:b433531`

3. **Verify services are running:**
   - All services should show as running except n8n (which has issues we're still debugging)
   - The app should be accessible at https://preview.clubomatic.ai

## Current Status:
- ✅ App container is working
- ✅ Database is running
- ✅ Redis is running
- ✅ MailHog is running
- ⏳ n8n is not starting (needs debugging)

## Network Fix Applied:
We've added an explicit network definition to prevent "network not found" errors:

```yaml
networks:
  default:
    driver: overlay
    attachable: true
```