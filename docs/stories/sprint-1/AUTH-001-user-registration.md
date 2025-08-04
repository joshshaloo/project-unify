# AUTH-001: User registration with NextAuth Magic Links

**Type:** Authentication  
**Points:** 4  
**Priority:** P0 (Blocker)  
**Dependencies:** TECH-002, TECH-004  

## Description
Implement passwordless user registration using NextAuth 5.0 with magic link authentication. Users register with email and receive a magic link to complete registration and create their club profile.

## Acceptance Criteria
- [ ] Registration page with form (email, name, club name)
- [ ] Magic link authentication working via NextAuth
- [ ] Email verification flow through magic links
- [ ] User profile creation on first login
- [ ] Club creation and admin role assignment
- [ ] Error handling and rate limiting
- [ ] Registration intent system for club creation
- [ ] Success messaging and email sent confirmation
- [ ] Redirect to dashboard after magic link verification

## Technical Details

### Current Architecture Context
- **Authentication:** NextAuth 5.0 with Nodemailer provider
- **Database:** Self-hosted PostgreSQL with NextAuth adapter
- **Email:** MailHog (dev) / SMTP (production)
- **Session:** Database-based sessions (required for email provider)

### Registration Flow (Magic Link Based)
1. User navigates to `/auth/signup`
2. Enters email, name, club name in form
3. Server action stores registration intent temporarily
4. Magic link generated and emailed via NextAuth
5. User clicks magic link in email
6. NextAuth verifies and creates/finds user account
7. Registration intent retrieved and club created
8. User redirected to `/dashboard`

### Server Action Implementation (Current)
```typescript
// apps/web/src/lib/auth/actions.ts (already implemented)
'use server'

export async function registerUser(prevState: any, formData: FormData) {
  const validatedData = registerSchema.parse({
    email: formData.get('email'),
    name: formData.get('name') || undefined,
    clubName: formData.get('clubName') || undefined,
  });
  
  // Rate limiting by email
  if (!checkRateLimit(`register:${validatedData.email}`, 3)) {
    return { error: 'Too many registration attempts. Please try again later.' };
  }

  // Store registration intent for club creation
  if (validatedData.clubName) {
    await storeRegistrationIntent(validatedData.email, {
      name: validatedData.name,
      clubName: validatedData.clubName,
    });
  }

  // Send magic link via NextAuth
  await generateMagicLink(validatedData.email);
  
  return { success: true, message: 'Check your email to complete registration!' };
}
```

### Frontend Components (Match Current Implementation)
```typescript
// apps/web/src/app/auth/signup/page.tsx (current file location)
import { SignupForm } from '@/components/auth/signup-form'

export default function SignupPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to create your coaching account
          </p>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}

// apps/web/src/components/auth/signup-form.tsx (already exists - matches this pattern)
'use client'

import { useFormState } from 'react-dom'
import { registerUser } from '@/app/auth/signup/actions'

export function SignupForm() {
  const [state, formAction] = useFormState(registerUser, null)
  
  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="coach@example.com"
        />
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="John Smith"
        />
      </div>
      
      <div>
        <label htmlFor="clubName" className="block text-sm font-medium">
          Club Name
        </label>
        <input
          id="clubName"
          name="clubName"
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          placeholder="FC United"
        />
      </div>
      
      {state?.error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{state.error}</div>
        </div>
      )}
      
      {state?.success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="text-sm text-green-700">{state.message}</div>
        </div>
      )}
      
      <button
        type="submit"
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Send Magic Link
      </button>
    </form>
  )
}
```

## Implementation Steps
1. ✅ **NextAuth Configuration** - Already implemented in `src/lib/auth.ts`
2. ✅ **Magic Link System** - Already implemented in `src/lib/auth/magic-link.ts`
3. ✅ **Registration Server Actions** - Already implemented in `src/lib/auth/actions.ts`
4. ✅ **Database Schema** - NextAuth tables + custom magic links in Prisma schema
5. ✅ **Registration Pages** - Already exist at `/auth/signup` and `/auth/login`
6. ✅ **Token Verification** - Already implemented in `/auth/verify/route.ts`
7. 🔲 **Club Creation Logic** - Verify club creation works in verification flow
8. 🔲 **Error Handling** - Enhance error messages and validation
9. 🔲 **Rate Limiting** - Consider Redis-based rate limiting for production
10. 🔲 **E2E Testing** - Comprehensive test coverage

## Current Database Schema (Already Implemented)
```sql
-- NextAuth tables (automatically managed)
CREATE TABLE accounts (...);
CREATE TABLE auth_sessions (...);
CREATE TABLE verification_tokens (...);

-- Custom magic links table
CREATE TABLE magic_links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL,
  token VARCHAR UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Club creation in registration flow
-- Handled in server action transaction:
-- 1. Create user account (NextAuth)
-- 2. Create club record
-- 3. Create user_club association with admin role
```

## Testing Scenarios
- ✅ **Magic Link Generation**: User receives email with working magic link
- ✅ **Email Validation**: Invalid emails rejected with clear error message
- ✅ **Rate Limiting**: Excessive requests properly throttled (3 per 15 minutes)
- 🔲 **Club Creation**: New club created and user assigned admin role
- 🔲 **Registration Intent**: Name and club name properly stored and applied
- 🔲 **Token Expiration**: Expired magic links show appropriate error
- 🔲 **Duplicate Registration**: Existing users handled gracefully
- 🔲 **Email Delivery**: Magic links delivered via MailHog (dev) and SMTP (prod)
- 🔲 **Session Creation**: User properly logged in after verification
- 🔲 **Dashboard Redirect**: Successful verification redirects to dashboard

## Security Features (Current Implementation)
- ✅ **Rate Limiting**: 3 attempts per email per 15 minutes (in-memory, Redis for prod)
- ✅ **Token Expiration**: Magic links expire after 10 minutes
- ✅ **CSRF Protection**: Built-in NextAuth protection
- ✅ **Email Validation**: Zod schema validation on server
- ✅ **Secure Sessions**: Database-based sessions with secure cookies
- 🔲 **Input Sanitization**: Validate and sanitize club name input
- 🔲 **Audit Logging**: Track all authentication events

## Developer Notes
- **Architecture**: NextAuth 5.0 with database sessions (required for email provider)
- **Email Provider**: Nodemailer via NextAuth, MailHog for development
- **Registration Intent**: Temporary storage for club creation data (use Redis in production)
- **Testing**: E2E tests should cover full magic link flow
- **Monitoring**: Track magic link generation and verification rates