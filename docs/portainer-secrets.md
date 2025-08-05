# Portainer Secrets Configuration

This document describes all the Docker secrets that need to be configured in Portainer for the application to work properly.

## Summary of Changes

Previously, we had hardcoded passwords in the docker-stack files. Now all passwords are properly managed through Docker secrets.

## Secrets to CREATE in Portainer:

### Preview Environment:
1. **soccer_preview_app_db_password** (NEW)
   - Purpose: Password for the `appuser` database user
   - Used by: postgres, app services
   - Description: Application database password for soccer database access

### Production Environment:
1. **soccer_prod_app_db_password** (NEW)
   - Purpose: Password for the `appuser` database user
   - Used by: postgres, app services
   - Description: Application database password for soccer database access

## Environment Variables to SET in Portainer:

When deploying the stack, set these environment variables:

### Preview Environment:
- **N8N_DB_PASSWORD** - Password for the `n8nuser` database user

### Production Environment:
- **N8N_DB_PASSWORD** - Password for the `n8nuser` database user

## Secrets to REMOVE from Portainer:

### Both Environments:
- **soccer_preview_n8n_password** - No longer needed (removed n8n basic auth)
- **soccer_prod_n8n_password** - No longer needed (removed n8n basic auth)

## Complete List of Required Secrets:

### Preview Environment:
- `soccer_preview_postgres_password` - PostgreSQL superuser password
- `soccer_preview_nextauth_secret` - NextAuth.js secret for sessions
- `soccer_preview_app_db_password` - Application database user password (NEW)

### Production Environment:
- `soccer_prod_postgres_password` - PostgreSQL superuser password
- `soccer_prod_nextauth_secret` - NextAuth.js secret for sessions
- `soccer_prod_smtp_password` - SMTP password for email sending
- `soccer_prod_app_db_password` - Application database user password (NEW)

## How to Create Secrets in Portainer:

1. Log into Portainer
2. Navigate to "Secrets" in the left menu
3. Click "Add secret"
4. Enter the secret name exactly as shown above
5. Enter the secret value (generate a strong password)
6. Click "Create the secret"

## Password Requirements:

For the `app_db_password` and `n8n_db_password` secrets, use strong passwords that:
- Are at least 16 characters long
- Contain uppercase and lowercase letters
- Contain numbers
- Contain special characters
- Do not contain quotes or shell special characters that might cause issues

Example: `Kj8#mN2pQ!xR4vT7`

## Database User Summary:

- **postgres** - Superuser, used for administrative tasks
- **appuser** - Application user, only has access to `soccer` database
- **n8nuser** - n8n user, only has access to `n8n` database

This separation ensures that:
1. The application cannot access n8n's data
2. n8n cannot access the application's data
3. Both services have minimal privileges (principle of least privilege)