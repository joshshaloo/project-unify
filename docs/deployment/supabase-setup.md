# Supabase Setup Guide

## 1. Create Supabase Project

### Sign Up / Log In
1. Go to https://supabase.com
2. Sign up with GitHub (recommended) or email
3. Verify your email if needed

### Create New Project
1. Click "New project"
2. Choose your organization (or create one)
3. **Project name**: `project-unify` (or similar)
4. **Database Password**: Generate a strong password and **SAVE IT**
5. **Region**: Choose closest to your users (e.g., US East)
6. **Pricing Plan**: Free tier is fine for development
7. Click "Create new project"
8. Wait ~2 minutes for provisioning

## 2. Get Your Credentials

Once your project is ready:

### API Settings
1. Go to Settings → API
2. Copy these values:
   - **Project URL**: `https://[YOUR-PROJECT-ID].supabase.co`
   - **Anon/Public Key**: `eyJ...` (long string)
   - **Service Role Key**: `eyJ...` (different long string - KEEP SECRET!)

### Database Settings
1. Go to Settings → Database
2. Copy the **Connection String** (URI)
3. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
   ```

## 3. Configure Local Environment

### Update Environment Files

**apps/web/.env.local**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...[YOUR-ANON-KEY]

# Keep existing
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**apps/api/.env**
```bash
# Database - Use connection pooling URL
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# Supabase
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_SERVICE_KEY=eyJ...[YOUR-SERVICE-KEY]

# Keep existing
OPENAI_API_KEY=sk-...
PORT=3001
NODE_ENV=development
```

## 4. Set Up Database Schema

### Enable Required Extensions
1. Go to SQL Editor in Supabase Dashboard
2. Run this query:
```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector for future AI features
CREATE EXTENSION IF NOT EXISTS vector;
```

### Run Prisma Migrations
```bash
# Generate Prisma Client
pnpm --filter @soccer/api prisma generate

# Push schema to database
pnpm --filter @soccer/api prisma db push

# Verify schema
pnpm --filter @soccer/api prisma studio
```

## 5. Set Up Row Level Security (RLS)

Run these SQL commands in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE "Club" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "UserClubRole" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TeamMember" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Drill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SessionDrill" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Curriculum" ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (we'll refine these later)
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid()::text = id);

-- Users can access clubs they belong to
CREATE POLICY "Users can view their clubs" ON "Club"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "UserClubRole"
      WHERE "UserClubRole"."clubId" = "Club".id
      AND "UserClubRole"."userId" = auth.uid()::text
    )
  );
```

## 6. Set Up Authentication

### Configure Auth Settings
1. Go to Authentication → Settings
2. Set up:
   - **Site URL**: `http://localhost:3000` (dev) / your production URL
   - **Redirect URLs**: 
     - `http://localhost:3000/auth/callback`
     - `https://your-app.vercel.app/auth/callback`
3. Save changes

### Email Templates (Optional)
1. Go to Authentication → Email Templates
2. Customize confirmation, reset password emails
3. Add your branding

## 7. Update Vercel Environment Variables

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Add these for all environments:

```bash
NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]

# For API (if deploying separately)
DATABASE_URL=[your-database-url-with-pgbouncer]
DIRECT_URL=[your-direct-database-url]
SUPABASE_URL=[your-supabase-url]
SUPABASE_SERVICE_KEY=[your-service-key]
```

## 8. Test the Connection

Create a test file to verify everything works:

**apps/web/src/lib/supabase-test.ts**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test function
export async function testConnection() {
  const { data, error } = await supabase
    .from('Club')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Supabase connection error:', error)
    return false
  }
  
  console.log('Supabase connected successfully!')
  return true
}
```

## 9. Security Checklist

- [ ] Never commit `.env` files
- [ ] Service Role Key only on backend
- [ ] Anon Key only for public operations
- [ ] RLS enabled on all tables
- [ ] Policies restrict data access
- [ ] Connection strings use pooling for production

## Next Steps

1. Run initial migrations
2. Create seed data
3. Set up auth flow
4. Test with Prisma Studio
5. Implement first API endpoints