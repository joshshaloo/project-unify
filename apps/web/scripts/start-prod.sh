#!/bin/sh
set -e

echo "🚀 Starting production server..."

# Run database migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Start the Next.js server
echo "✅ Starting Next.js..."
exec node server.js