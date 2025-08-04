#!/bin/bash

echo "🗄️  Database Setup Script"
echo "======================="
echo ""

# Check if .env files exist
if [ ! -f "apps/api/.env" ]; then
    echo "⚠️  Creating apps/api/.env from example..."
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env - Please add your Supabase credentials!"
fi

if [ ! -f "apps/web/.env.local" ]; then
    echo "⚠️  Creating apps/web/.env.local from example..."
    cp apps/web/.env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local - Please add your Supabase credentials!"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Add your Supabase credentials to the .env files"
echo "2. Run: pnpm --filter @soccer/api prisma generate"
echo "3. Run: pnpm --filter @soccer/api prisma db push"
echo "4. Run: pnpm --filter @soccer/api prisma studio (to view database)"
echo ""
echo "🔐 Required Environment Variables:"
echo ""
echo "apps/web/.env.local:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo "apps/api/.env:"
echo "  - DATABASE_URL"
echo "  - DIRECT_URL"
echo "  - SUPABASE_URL"
echo "  - SUPABASE_SERVICE_KEY"