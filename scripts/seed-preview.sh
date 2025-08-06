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

# Run migrations first to ensure schema is up to date
echo "📦 Running database migrations..."
pnpm prisma migrate deploy

# Run seed script
echo "🌱 Seeding database with test data..."
pnpm db:seed

echo "✅ Database seeding completed successfully!"