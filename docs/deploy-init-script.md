# Deploy PostgreSQL Init Script

The init-data.sh script needs to be copied to the shared volume before deploying the stack.

## Steps:

1. Copy the script to the shared volume:
```bash
scp scripts/init-data.sh docker@172.20.0.22:/mnt/truenas/docker_volumes/project-unity/config/
```

2. SSH to the server and verify:
```bash
ssh docker@172.20.0.22
ls -la /mnt/truenas/docker_volumes/project-unity/config/init-data.sh
```

3. Make sure it's executable:
```bash
chmod +x /mnt/truenas/docker_volumes/project-unity/config/init-data.sh
```

## Required Secrets in Portainer:

### Preview Environment:
- `soccer_preview_postgres_password` - PostgreSQL superuser password
- `soccer_preview_nextauth_secret` - NextAuth.js secret for sessions
- `soccer_preview_app_db_password` - Application database user password

### Production Environment:
- `soccer_prod_postgres_password` - PostgreSQL superuser password
- `soccer_prod_nextauth_secret` - NextAuth.js secret for sessions
- `soccer_prod_smtp_password` - SMTP password for email sending
- `soccer_prod_app_db_password` - Application database user password

## What the script does:

- Creates a non-root user `appuser` with password from `app_db_password` secret
- Creates the `n8n` database (the `soccer` database is already created by POSTGRES_DB)
- Grants full privileges on both databases to the `appuser`

## Database Access:

Both the main app and n8n will use:
- User: `appuser`
- Password: From `app_db_password` secret
- Databases: `soccer` (main app) and `n8n` (n8n workflows)

The postgres superuser still uses the password from the `postgres_password` secret.