# App Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Email Authentication Error: "Missing credentials for 'PLAIN'"

**Cause**: The app is trying to authenticate with MailHog in preview environment, but MailHog doesn't require authentication.

**Solution**: Already fixed in code. The email configuration now detects MailHog and skips authentication.

### 2. Database Connection Error: "Socket not connected"

**Cause**: The app cannot connect to the PostgreSQL database. This usually means:
- The `app_db_password` secret is not created in Portainer
- The `appuser` database user doesn't exist
- Password mismatch between secret and database user

**Solution**:

1. **Create the app_db_password secret in Portainer**:
   - Go to Secrets in Portainer
   - Create `soccer_preview_app_db_password` 
   - Set a secure password value

2. **Verify the database user exists**:
   ```bash
   # SSH to Docker host (172.20.0.22)
   # Check if appuser exists
   PGPASSWORD='[postgres-password]' psql -h localhost -p 5435 -U postgres -d postgres \
     -c "SELECT usename FROM pg_user WHERE usename = 'appuser';"
   ```

3. **If appuser doesn't exist, create it**:
   ```bash
   # Use the fix script
   ./scripts/fix-n8n-user.sh '[app-password]' preview
   # Note: This script creates both n8nuser and fixes appuser if needed
   ```

4. **Debug using the debug script**:
   ```bash
   ./scripts/debug-app-deployment.sh
   ```

### 3. Container Keeps Restarting

**Check logs**:
```bash
docker service logs soccer-preview_app --tail 50
```

**Common causes**:
- Missing secrets
- Database connection failure
- Migration errors

### Required Secrets Summary

For the preview environment, ensure these secrets exist in Portainer:
- `soccer_preview_postgres_password` - PostgreSQL superuser password
- `soccer_preview_nextauth_secret` - NextAuth.js session secret
- `soccer_preview_app_db_password` - Application database password (NEW!)

### Database Users Summary

The application uses separate database users for security:
- `postgres` - Superuser (only for admin tasks)
- `appuser` - Application user (access to soccer database only)
- `n8nuser` - n8n user (access to n8n database only)

### Quick Checks

1. **Is the app running?**
   ```bash
   docker service ps soccer-preview_app
   ```

2. **Can the app reach the database?**
   ```bash
   # Get app container ID
   APP_CONTAINER=$(docker ps --filter "label=com.docker.swarm.service.name=soccer-preview_app" -q | head -1)
   # Test connectivity
   docker exec $APP_CONTAINER sh -c "nc -zv postgres 5432"
   ```

3. **Are all secrets loaded?**
   Check the app logs for lines starting with `[ENTRYPOINT]` to see which secrets were loaded.

### Environment Variables

The app expects these environment variables (set in docker-stack.yml):
- `NODE_ENV=production`
- `REDIS_URL=redis://redis:6379`
- `NEXTAUTH_URL=https://preview.clubomatic.ai`
- `EMAIL_SERVER_HOST=mailhog`
- `EMAIL_SERVER_PORT=1025`
- `EMAIL_FROM=noreply@preview.clubomatic.ai`

Database URLs are constructed by the entrypoint script from secrets.