#!/bin/bash
set -e

# Script to create multiple databases in PostgreSQL
# This runs as part of the PostgreSQL initialization

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE n8n;
    GRANT ALL PRIVILEGES ON DATABASE n8n TO $POSTGRES_USER;
EOSQL

echo "Multiple databases created successfully"