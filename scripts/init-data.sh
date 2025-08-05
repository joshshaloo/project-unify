#!/bin/bash
set -e;

echo "Initializing PostgreSQL databases..."

# Read app password from file if specified
if [ -n "${POSTGRES_APP_PASSWORD_FILE:-}" ] && [ -f "${POSTGRES_APP_PASSWORD_FILE}" ]; then
    POSTGRES_APP_PASSWORD=$(cat "${POSTGRES_APP_PASSWORD_FILE}")
fi

# n8n password comes from environment variable (passed in docker-stack.yml)

# Create app user if specified
if [ -n "${POSTGRES_APP_USER:-}" ] && [ -n "${POSTGRES_APP_PASSWORD:-}" ]; then
    echo "Creating user ${POSTGRES_APP_USER}..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create user if not exists
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${POSTGRES_APP_USER}') THEN
                CREATE USER ${POSTGRES_APP_USER} WITH PASSWORD '${POSTGRES_APP_PASSWORD}';
            END IF;
        END
        \$\$;
EOSQL
    echo "User ${POSTGRES_APP_USER} created or already exists."
else
    echo "SETUP INFO: No Environment variables given for app user!"
fi

# Create n8n user if specified
if [ -n "${POSTGRES_N8N_USER:-}" ] && [ -n "${POSTGRES_N8N_PASSWORD:-}" ]; then
    echo "Creating user ${POSTGRES_N8N_USER}..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create user if not exists
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${POSTGRES_N8N_USER}') THEN
                CREATE USER ${POSTGRES_N8N_USER} WITH PASSWORD '${POSTGRES_N8N_PASSWORD}';
            END IF;
        END
        \$\$;
EOSQL
    echo "User ${POSTGRES_N8N_USER} created or already exists."
else
    echo "SETUP INFO: No Environment variables given for n8n user!"
fi

# Create n8n database
echo "Creating n8n database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create n8n database if not exists
    SELECT 'CREATE DATABASE n8n' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec
EOSQL

# Grant privileges on n8n database to n8n user
if [ -n "${POSTGRES_N8N_USER:-}" ]; then
    echo "Granting privileges on n8n database to ${POSTGRES_N8N_USER}..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "n8n" <<-EOSQL
        GRANT ALL PRIVILEGES ON DATABASE n8n TO ${POSTGRES_N8N_USER};
        GRANT CREATE ON SCHEMA public TO ${POSTGRES_N8N_USER};
        ALTER DATABASE n8n OWNER TO ${POSTGRES_N8N_USER};
EOSQL
fi

# Grant privileges on soccer database to app user
if [ -n "${POSTGRES_APP_USER:-}" ] && [ -n "${POSTGRES_DB:-}" ]; then
    echo "Granting privileges on ${POSTGRES_DB} database to ${POSTGRES_APP_USER}..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_APP_USER};
        GRANT CREATE ON SCHEMA public TO ${POSTGRES_APP_USER};
EOSQL
fi

echo "Database initialization complete!"