# Supabase Auth Configuration

## Prerequisites
- Supabase project already created
- Environment variables configured

## Setup Steps

### 1. Configure Authentication URLs

1. Go to your Supabase Dashboard
2. Navigate to Authentication > URL Configuration
3. Set the following URLs:

**Site URL:**
- Local: `http://localhost:3001`
- Production: `https://your-vercel-app.vercel.app`

**Redirect URLs (add all of these):**
- `http://localhost:3001/auth/callback`
- `https://your-vercel-app.vercel.app/auth/callback`
- `https://*.vercel.app/auth/callback` (for preview deployments)

### 2. Enable Email Authentication

1. Go to Authentication > Providers
2. Ensure Email provider is enabled
3. Configure email templates if needed

### 3. Configure Email Templates (Optional)

1. Go to Authentication > Email Templates
2. Customize the confirmation email to include your branding
3. Make sure the confirmation URL uses: `{{ .ConfirmationURL }}`

### 4. Email Configuration

For MVP, we're using Supabase's built-in email service:

**Development/MVP:**
- Uses Supabase's default email service
- Limited to 3 emails per hour on free tier
- Perfect for testing and early development

**Future Production Setup:**
When you need higher email volume or custom branding:
1. Go to Project Settings > Auth
2. Enable "Custom SMTP"
3. Configure with your preferred provider:
   - SendGrid
   - AWS SES
   - Postmark
   - Or any SMTP provider

### 5. Test Authentication Flow

1. Create a test account at `/auth/signup`
2. Check your email for confirmation link (may take a few minutes)
3. Click the link to verify your account
4. You should be redirected to the dashboard

**Note for Local Development:**
- The app runs on port 3001 (not 3000) when port 3000 is in use
- Make sure your redirect URLs in Supabase include `http://localhost:3001/auth/callback`
- Supabase free tier limits emails to 3 per hour for testing

## Environment Variables

Make sure these are set in both local and Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

### Email not sending
- Check spam folder
- Verify SMTP settings in production
- Check Supabase logs for errors

### Redirect not working
- Ensure callback URL is in redirect allowlist
- Check middleware configuration
- Verify environment variables

### User not created in database
- Check Prisma schema is synced
- Verify database connection
- Check server logs for errors