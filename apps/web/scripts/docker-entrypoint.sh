#!/bin/sh
set -e

# Read secrets if they exist and export as environment variables
if [ -f /run/secrets/postgres_password ]; then
    export POSTGRES_PASSWORD=$(cat /run/secrets/postgres_password)
    export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/soccer"
    export DIRECT_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/soccer"
fi

if [ -f /run/secrets/nextauth_secret ]; then
    export NEXTAUTH_SECRET=$(cat /run/secrets/nextauth_secret)
fi


if [ -f /run/secrets/smtp_password ]; then
    export EMAIL_SERVER_PASSWORD=$(cat /run/secrets/smtp_password)
fi

# Execute the original start script
exec ./start-prod.sh