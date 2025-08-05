#!/bin/bash

# Script to manually create n8n database user if init script didn't run properly

echo "=== n8n Database User Fix Script ==="
echo ""

# Check if we have required parameters
if [ -z "$1" ]; then
    echo "Usage: $0 <n8n_password> [environment]"
    echo "  environment: preview or prod (default: preview)"
    echo ""
    echo "Example: $0 'MySecurePassword123!' preview"
    exit 1
fi

N8N_PASSWORD="$1"
ENVIRONMENT="${2:-preview}"

# Set port based on environment
if [ "$ENVIRONMENT" = "prod" ]; then
    PG_PORT=5434
else
    PG_PORT=5435
fi

echo "Environment: $ENVIRONMENT"
echo "PostgreSQL Port: $PG_PORT"
echo ""

# First, get the postgres password
echo "Enter the postgres superuser password:"
read -s POSTGRES_PASSWORD

echo ""
echo "Connecting to PostgreSQL..."

# Create the SQL commands
SQL_COMMANDS=$(cat <<EOF
-- Check if n8n database exists
SELECT 'Database n8n exists: ' || EXISTS(SELECT 1 FROM pg_database WHERE datname = 'n8n')::text;

-- Check if n8nuser exists
SELECT 'User n8nuser exists: ' || EXISTS(SELECT 1 FROM pg_user WHERE usename = 'n8nuser')::text;

-- Create n8n database if it doesn't exist
SELECT 'Creating n8n database...' WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'n8n');
CREATE DATABASE n8n;

-- Create or update n8nuser
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'n8nuser') THEN
        CREATE USER n8nuser WITH PASSWORD '$N8N_PASSWORD';
        RAISE NOTICE 'Created user n8nuser';
    ELSE
        ALTER USER n8nuser WITH PASSWORD '$N8N_PASSWORD';
        RAISE NOTICE 'Updated password for n8nuser';
    END IF;
END
\$\$;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE n8n TO n8nuser;
ALTER DATABASE n8n OWNER TO n8nuser;

-- Show final status
SELECT 'Setup complete. n8nuser can now connect to n8n database.';
EOF
)

# Execute the commands
PGPASSWORD="$POSTGRES_PASSWORD" psql -h 172.20.0.22 -p $PG_PORT -U postgres -d postgres <<< "$SQL_COMMANDS"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ n8n database user setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. In Portainer, edit the soccer-$ENVIRONMENT stack"
    echo "2. Add environment variable: N8N_DB_PASSWORD=$N8N_PASSWORD"
    echo "3. Update the stack"
    echo ""
    echo "To test the connection:"
    echo "PGPASSWORD='$N8N_PASSWORD' psql -h 172.20.0.22 -p $PG_PORT -U n8nuser -d n8n -c 'SELECT 1;'"
else
    echo ""
    echo "❌ Failed to setup n8n user. Check the postgres password and try again."
fi