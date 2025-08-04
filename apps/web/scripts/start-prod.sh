#!/bin/sh
set -e

echo "🚀 Starting production server..."

# Run database migrations
echo "📦 Running database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy

# Start the Next.js server
echo "✅ Starting Next.js..."
exec node server.js