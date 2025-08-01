# Vercel Setup Guide

## Import Project

1. **Go to Vercel Dashboard**
   - Navigate to https://vercel.com/dashboard
   - Click "Add New..." → "Project"

2. **Import Git Repository**
   - Click "Import Git Repository"
   - If not connected, authorize Vercel to access your GitHub
   - Search for "project-unify"
   - Click "Import"

## Configure Project

### Basic Settings
- **Framework Preset**: Next.js (should auto-detect)
- **Root Directory**: `./` (leave as-is)
- **Build Command**: `pnpm turbo run build --filter=@soccer/web`
- **Output Directory**: `apps/web/.next`
- **Install Command**: `pnpm install`

### Environment Variables

Add these environment variables in the Vercel dashboard:

#### Production Environment Variables
```bash
# Supabase (you'll get these when setting up Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.vercel.app

# External APIs (optional for now)
NEXT_PUBLIC_YOUTUBE_API_KEY=your-youtube-api-key

# Turbo Remote Caching (optional but recommended)
TURBO_TOKEN=your-turbo-token
TURBO_TEAM=your-team-name
```

#### Development/Preview Environment Variables
Use the same variables but with local/test values.

## Deploy Settings

1. **Deployment Protection**
   - Go to Settings → Deployment Protection
   - Enable "Vercel Authentication" for preview deployments
   - This protects preview URLs from public access

2. **Domains**
   - Settings → Domains
   - Add custom domain when ready
   - For now, use the `.vercel.app` domain

3. **Functions**
   - Settings → Functions
   - Region: US East (Virginia) - iad1
   - Max Duration: 10s (can increase on Pro plan)

## GitHub Integration

1. **Auto-deployments**
   - Production Branch: `main`
   - Preview Branches: All branches
   - Deploy Hooks: Keep enabled

2. **Comments**
   - Enable "Comments on Pull Requests"
   - This adds preview links to PRs

## Build & Development Settings

1. **Node.js Version**
   - Settings → General
   - Node.js Version: 20.x

2. **pnpm Version**
   - Vercel auto-detects from packageManager field
   - Already set to pnpm@8.15.1

## Post-Deployment Steps

### 1. Verify Deployment
After clicking "Deploy", wait for the build to complete. You should see:
- ✅ Build successful
- Preview URL generated
- No errors in build logs

### 2. Test the Deployment
- Click "Visit" to see your deployed app
- Should see Next.js default page (we'll add content next)
- Check Functions tab for API endpoints

### 3. Set Up Deployment Notifications
- Settings → Integrations
- Add Slack/Discord notifications (optional)

## Secrets Management

### GitHub Secrets (for CI/CD)
Add these to your GitHub repository settings:

```bash
VERCEL_TOKEN=xxx        # Get from Vercel account settings
VERCEL_ORG_ID=xxx      # Get from Vercel project settings
VERCEL_PROJECT_ID=xxx  # Get from Vercel project settings
```

### Get Vercel Tokens:
1. **VERCEL_TOKEN**
   - Go to https://vercel.com/account/tokens
   - Create new token with full scope
   - Copy and save securely

2. **VERCEL_ORG_ID & VERCEL_PROJECT_ID**
   - In your Vercel project, go to Settings → General
   - Scroll to "Project ID" section
   - Copy both IDs

## Troubleshooting

### Build Fails
- Check build logs for specific errors
- Ensure all environment variables are set
- Verify pnpm-lock.yaml is committed

### 404 Errors
- Check vercel.json rewrites
- Ensure Next.js pages are in correct directory

### Function Timeouts
- Increase function duration in settings
- Optimize long-running operations

## Next Steps

1. Complete Supabase setup to get real environment variables
2. Create initial pages in Next.js app
3. Test preview deployments with a PR
4. Set up custom domain when ready