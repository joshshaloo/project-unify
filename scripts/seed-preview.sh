#!/bin/bash
# Script to seed the preview database
# Used in CI/CD pipeline after deployment

set -e

echo "🌱 Seeding preview database..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is not set"
  exit 1
fi

# Set DIRECT_URL to the same as DATABASE_URL if not already set
# (Preview database doesn't use connection pooling)
if [ -z "$DIRECT_URL" ]; then
  export DIRECT_URL="$DATABASE_URL"
  echo "📝 Setting DIRECT_URL to match DATABASE_URL"
fi

# Run migrations first to ensure schema is up to date
echo "📦 Running database migrations..."
pnpm prisma migrate deploy

# Run seed script
echo "🌱 Seeding database with test data..."
pnpm db:seed

echo "✅ Database seeding completed successfully!"