#!/bin/bash
set -e;

echo "Initializing PostgreSQL databases..."

# Read password from file if specified
if [ -n "${POSTGRES_NON_ROOT_PASSWORD_FILE:-}" ] && [ -f "${POSTGRES_NON_ROOT_PASSWORD_FILE}" ]; then
    POSTGRES_NON_ROOT_PASSWORD=$(cat "${POSTGRES_NON_ROOT_PASSWORD_FILE}")
fi

# Create non-root user if specified
if [ -n "${POSTGRES_NON_ROOT_USER:-}" ] && [ -n "${POSTGRES_NON_ROOT_PASSWORD:-}" ]; then
    echo "Creating user ${POSTGRES_NON_ROOT_USER}..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        -- Create user if not exists
        DO \$\$
        BEGIN
            IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = '${POSTGRES_NON_ROOT_USER}') THEN
                CREATE USER ${POSTGRES_NON_ROOT_USER} WITH PASSWORD '${POSTGRES_NON_ROOT_PASSWORD}';
            END IF;
        END
        \$\$;
EOSQL
    echo "User ${POSTGRES_NON_ROOT_USER} created or already exists."
else
    echo "SETUP INFO: No Environment variables given for non-root user!"
fi

# Create n8n database
echo "Creating n8n database..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    -- Create n8n database if not exists
    SELECT 'CREATE DATABASE n8n' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'n8n')\gexec
EOSQL

# Grant privileges on n8n database to non-root user if exists
if [ -n "${POSTGRES_NON_ROOT_USER:-}" ]; then
    echo "Granting privileges on n8n database to ${POSTGRES_NON_ROOT_USER}..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "n8n" <<-EOSQL
        GRANT ALL PRIVILEGES ON DATABASE n8n TO ${POSTGRES_NON_ROOT_USER};
        GRANT CREATE ON SCHEMA public TO ${POSTGRES_NON_ROOT_USER};
        ALTER DATABASE n8n OWNER TO ${POSTGRES_NON_ROOT_USER};
EOSQL
fi

# Grant privileges on soccer database (already created by POSTGRES_DB env var) to non-root user if exists
if [ -n "${POSTGRES_NON_ROOT_USER:-}" ] && [ -n "${POSTGRES_DB:-}" ]; then
    echo "Granting privileges on ${POSTGRES_DB} database to ${POSTGRES_NON_ROOT_USER}..."
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
        GRANT ALL PRIVILEGES ON DATABASE ${POSTGRES_DB} TO ${POSTGRES_NON_ROOT_USER};
        GRANT CREATE ON SCHEMA public TO ${POSTGRES_NON_ROOT_USER};
EOSQL
fi

echo "Database initialization complete!"