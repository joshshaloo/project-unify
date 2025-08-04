#!/bin/sh

echo "🚀 Starting production server..."

# Run database migrations (don't use set -e so we can handle errors gracefully)
echo "📦 Running database migrations..."
if node ./node_modules/prisma/build/index.js migrate deploy 2>&1; then
    echo "✅ Migrations completed successfully"
else
    MIGRATION_EXIT_CODE=$?
    echo "⚠️  Migration deployment failed with exit code: $MIGRATION_EXIT_CODE"
    echo "   This might be expected for existing databases."
    echo "   Continuing with application startup..."
fi

# Start the Next.js server
echo "✅ Starting Next.js..."
exec node apps/web/server.js