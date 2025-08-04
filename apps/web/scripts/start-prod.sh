#!/bin/sh
set -e

echo "🚀 Starting production server..."

# Skip migrations in production - they should be run as a separate deployment step
echo "📦 Skipping database migrations (run separately if needed)"

# Start the Next.js server
echo "✅ Starting Next.js..."
exec node server.js