#!/bin/sh
set -e

echo "[n8n-entrypoint] Starting n8n with secret loading..."

# Load secrets if they exist
if [ -f /run/secrets/n8n_password ]; then
    export N8N_BASIC_AUTH_PASSWORD=$(cat /run/secrets/n8n_password)
    echo "[n8n-entrypoint] Loaded N8N_BASIC_AUTH_PASSWORD from secret"
fi

if [ -f /run/secrets/postgres_password ]; then
    export DB_POSTGRESDB_PASSWORD=$(cat /run/secrets/postgres_password)
    echo "[n8n-entrypoint] Loaded DB_POSTGRESDB_PASSWORD from secret"
fi

# Debug environment
echo "[n8n-entrypoint] Environment check:"
echo "[n8n-entrypoint]   N8N_HOST=$N8N_HOST"
echo "[n8n-entrypoint]   DB_TYPE=$DB_TYPE"
echo "[n8n-entrypoint]   DB_POSTGRESDB_HOST=$DB_POSTGRESDB_HOST"
echo "[n8n-entrypoint]   DB_POSTGRESDB_DATABASE=$DB_POSTGRESDB_DATABASE"
echo "[n8n-entrypoint]   DB_POSTGRESDB_USER=$DB_POSTGRESDB_USER"
echo "[n8n-entrypoint]   DB_POSTGRESDB_PORT=$DB_POSTGRESDB_PORT"
echo "[n8n-entrypoint]   N8N_BASIC_AUTH_USER=$N8N_BASIC_AUTH_USER"
echo "[n8n-entrypoint]   N8N_BASIC_AUTH_PASSWORD is $([ -n "$N8N_BASIC_AUTH_PASSWORD" ] && echo "set" || echo "not set")"
echo "[n8n-entrypoint]   DB_POSTGRESDB_PASSWORD is $([ -n "$DB_POSTGRESDB_PASSWORD" ] && echo "set" || echo "not set")"

# Start n8n
echo "[n8n-entrypoint] Starting n8n..."
exec n8n