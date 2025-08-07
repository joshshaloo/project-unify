# Deployment Credentials Reference

This document outlines all credentials used in the deployment and how they're configured.

## PostgreSQL Configuration

### Database Users
- **Username**: `postgres` (hardcoded in all services)
- **Password**: Read from Docker secrets

### Databases
- **soccer**: Main application database (created by PostgreSQL on startup)
- **n8n**: n8n workflow database (created by postgres-init service)

### Connection Details
- **Host**: `postgres` (internal Docker network)
- **Port**: `5432` (internal), exposed as:
  - Preview: `5435` (external)
  - Production: `5434` (external)

## Service Credentials

### Main Application (app service)
- **Database URL**: `postgresql://postgres:<SECRET>@postgres:5432/soccer`
- **NextAuth Secret**: Read from `nextauth_secret`
- **SMTP Password** (prod only): Read from `smtp_password`

### n8n Service
- **Admin Username**: `admin` (hardcoded)
- **Admin Password**: Read from `n8n_password` secret
- **Database**: `postgresql://postgres:<SECRET>@postgres:5432/n8n`

## Docker Secrets Required

### Preview Environment
1. `soccer_preview_postgres_password` - PostgreSQL password
2. `soccer_preview_nextauth_secret` - NextAuth.js session secret
3. `soccer_preview_n8n_password` - n8n admin password

### Production Environment
1. `soccer_prod_postgres_password` - PostgreSQL password
2. `soccer_prod_nextauth_secret` - NextAuth.js session secret
3. `soccer_prod_n8n_password` - n8n admin password
4. `soccer_prod_smtp_password` - SMTP password for email sending

## How Secrets Are Used

### PostgreSQL
- Uses `POSTGRES_PASSWORD_FILE` environment variable
- Automatically reads password from `/run/secrets/postgres_password`

### Main App
- Custom `docker-entrypoint.sh` reads secrets and constructs DATABASE_URL
- No newline stripping needed

### n8n
- Custom entrypoint reads secrets and strips newlines with `tr -d '\n'`
- This avoids the known n8n issue with trailing newlines

### postgres-init
- One-time service that creates the n8n database
- Reads postgres password to connect and create database

## Security Notes

1. All passwords are stored as Docker Swarm secrets (encrypted at rest)
2. Secrets are only accessible to services that explicitly request them
3. No passwords are stored in environment variables or stack files
4. Database connections use internal Docker network (not exposed externally)

## Generating Secure Values

```bash
# For passwords (24 characters)
openssl rand -base64 24

# For NextAuth secrets (32 characters)
openssl rand -base64 32
```

## Testing Connections

After deployment, you can test database connections:

```bash
# Preview database (from Tailnet)
psql -h 172.20.0.22 -p 5435 -U postgres -d soccer
psql -h 172.20.0.22 -p 5435 -U postgres -d n8n

# Production database (from Tailnet)
psql -h 172.20.0.22 -p 5434 -U postgres -d soccer
psql -h 172.20.0.22 -p 5434 -U postgres -d n8n
```