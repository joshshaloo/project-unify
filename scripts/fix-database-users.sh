#!/bin/bash

# Quick fix for database users in preview/prod

ENVIRONMENT="${1:-preview}"
POSTGRES_PASSWORD="$2"
APP_PASSWORD="$3"
N8N_PASSWORD="$4"

if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$APP_PASSWORD" ] || [ -z "$N8N_PASSWORD" ]; then
    echo "Usage: $0 [preview|prod] <postgres_password> <app_password> <n8n_password>"
    exit 1
fi

PORT=5435
if [ "$ENVIRONMENT" = "prod" ]; then
    PORT=5434
fi

echo "Creating database users for $ENVIRONMENT environment..."

PGPASSWORD="$POSTGRES_PASSWORD" psql -h 172.20.0.22 -p $PORT -U postgres <<EOF
-- Create databases
CREATE DATABASE soccer;
CREATE DATABASE n8n;

-- Create users
CREATE USER appuser WITH PASSWORD '$APP_PASSWORD';
CREATE USER n8nuser WITH PASSWORD '$N8N_PASSWORD';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE soccer TO appuser;
ALTER DATABASE soccer OWNER TO appuser;

GRANT ALL PRIVILEGES ON DATABASE n8n TO n8nuser;
ALTER DATABASE n8n OWNER TO n8nuser;

-- Show results
\du
EOF

echo "Done. Now:"
echo "1. Create secret soccer_${ENVIRONMENT}_app_db_password in Portainer with value: $APP_PASSWORD"
echo "2. Set environment variable N8N_DB_PASSWORD=$N8N_PASSWORD when deploying stack"