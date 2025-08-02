# Vercel Environment Variables

This document lists all the environment variables that need to be configured in Vercel for the Project Unify application.

## Required Environment Variables

### Supabase Configuration

```env
NEXT_PUBLIC_SUPABASE_URL=https://ouakhbtaifurigsjdnpt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Database Configuration (for Prisma)

```env
DATABASE_URL=postgresql://postgres.ouakhbtaifurigsjdnpt:your-password@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.ouakhbtaifurigsjdnpt:your-password@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**Note**: The `DATABASE_URL` uses port 6543 with pgbouncer for connection pooling (required for serverless). The `DIRECT_URL` uses port 5432 for migrations.

### Application Configuration

```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Optional APIs

```env
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key
```

## Setting Up in Vercel

### Method 1: Vercel Dashboard

1. Go to your project in Vercel Dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate values
4. Set the environment scope (Production, Preview, Development)

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link your project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add NEXT_PUBLIC_APP_URL
```

### Method 3: Using .env.production

Create a `.env.production` file and use Vercel's environment variable import:

```bash
vercel env pull .env.production
# Edit the file with your production values
vercel env push .env.production
```

## Environment Scopes

- **Production**: Live application
- **Preview**: Pull request previews
- **Development**: Local development (when using `vercel dev`)

Recommended settings:
- Database URLs: All environments
- Supabase keys: All environments
- App URL: Different for each environment

## Security Considerations

1. **Never commit** `.env` files with real values to Git
2. **NEXT_PUBLIC_** variables are exposed to the browser
3. Database URLs should never have `NEXT_PUBLIC_` prefix
4. Use different Supabase projects for production/staging if possible

## Verifying Configuration

After deployment, verify your environment variables:

1. Check build logs for any missing variable warnings
2. Test authentication flow
3. Verify database connections
4. Check browser console for any API errors

## Troubleshooting

### Common Issues

1. **Build fails with "Missing environment variable"**
   - Ensure all required variables are set
   - Check variable names match exactly (case-sensitive)

2. **Database connection errors**
   - Verify DATABASE_URL uses pgbouncer port (6543)
   - Check connection string format
   - Ensure database password is URL-encoded if it contains special characters

3. **Authentication not working**
   - Verify Supabase URL and anon key
   - Check redirect URLs in Supabase dashboard include your Vercel domains
   - Ensure NEXT_PUBLIC_ prefix is used for client-side variables

### Redirect URLs for Supabase

Add these to your Supabase Auth settings:
- `https://your-app.vercel.app/auth/callback`
- `https://*.vercel.app/auth/callback` (for preview deployments)
- `https://your-custom-domain.com/auth/callback` (if using custom domain)