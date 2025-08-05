#!/bin/sh

echo "[START-PROD] Starting production server script..."
echo "[START-PROD] Current user: $(whoami)"
echo "[START-PROD] Current directory: $(pwd)"

# Check if server.js exists
if [ -f "apps/web/server.js" ]; then
    echo "[START-PROD] Found server.js at apps/web/server.js"
else
    echo "[START-PROD] ERROR: server.js not found at apps/web/server.js!"
    echo "[START-PROD] Directory contents:"
    ls -la apps/web/
    exit 1
fi

echo "[START-PROD] 🚀 Starting production server..."

# Show environment status
echo "[START-PROD] Environment check:"
echo "[START-PROD]    DATABASE_URL is $([ -n "$DATABASE_URL" ] && echo "set" || echo "not set")"
echo "[START-PROD]    DIRECT_URL is $([ -n "$DIRECT_URL" ] && echo "set" || echo "not set")"

# Run database migrations (don't use set -e so we can handle errors gracefully)
echo "[START-PROD] 📦 Running database migrations..."
if [ -n "$DATABASE_URL" ]; then
    # Try to run migrations using node to execute prisma directly
    if node node_modules/prisma/build/index.js migrate deploy 2>&1; then
        echo "[START-PROD] ✅ Migrations completed successfully"
    else
        MIGRATION_EXIT_CODE=$?
        echo "[START-PROD] ⚠️  Migration deployment failed with exit code: $MIGRATION_EXIT_CODE"
        echo "[START-PROD]    This might be expected for existing databases."
        echo "[START-PROD]    Continuing with application startup..."
    fi
else
    echo "[START-PROD] ⚠️  DATABASE_URL not set, skipping migrations"
fi

# Start the Next.js server
echo "[START-PROD] ✅ Starting Next.js..."
echo "[START-PROD] Executing: node apps/web/server.js"
exec node apps/web/server.js