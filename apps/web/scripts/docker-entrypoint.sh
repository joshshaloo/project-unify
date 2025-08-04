#!/bin/sh

echo "[ENTRYPOINT] Starting docker-entrypoint.sh..."
echo "[ENTRYPOINT] Current user: $(whoami)"
echo "[ENTRYPOINT] Current directory: $(pwd)"

echo "[ENTRYPOINT] 🔧 Configuring environment..."

# Read secrets if they exist and export as environment variables
if [ -f /run/secrets/postgres_password ]; then
    echo "[ENTRYPOINT]    Loading PostgreSQL password from secret..."
    export POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
    export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/soccer"
    export DIRECT_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/soccer"
    echo "[ENTRYPOINT]    Database URL configured"
else
    echo "[ENTRYPOINT]    No postgres_password secret found, using environment variables"
fi

if [ -f /run/secrets/nextauth_secret ]; then
    echo "[ENTRYPOINT]    Loading NextAuth secret..."
    export NEXTAUTH_SECRET=$(cat /run/secrets/nextauth_secret)
    echo "[ENTRYPOINT]    NextAuth secret loaded"
else
    echo "[ENTRYPOINT]    No nextauth_secret found, using environment variables"
fi

if [ -f /run/secrets/smtp_password ]; then
    echo "[ENTRYPOINT]    Loading SMTP password..."
    export EMAIL_SERVER_PASSWORD=$(cat /run/secrets/smtp_password)
else
    echo "[ENTRYPOINT]    No smtp_password secret found"
fi

# Debug: Show environment (without secrets)
echo "[ENTRYPOINT] Environment check:"
echo "[ENTRYPOINT]    NODE_ENV=${NODE_ENV}"
echo "[ENTRYPOINT]    NEXTAUTH_URL=${NEXTAUTH_URL}"
echo "[ENTRYPOINT]    DATABASE_URL is $([ -n "$DATABASE_URL" ] && echo "set" || echo "not set")"
echo "[ENTRYPOINT]    DIRECT_URL is $([ -n "$DIRECT_URL" ] && echo "set" || echo "not set")"
echo "[ENTRYPOINT]    NEXTAUTH_SECRET is $([ -n "$NEXTAUTH_SECRET" ] && echo "set" || echo "not set")"

# Execute the original start script
echo "[ENTRYPOINT] 🚀 Starting application..."
echo "[ENTRYPOINT] Executing: ./start-prod.sh"
exec ./start-prod.sh