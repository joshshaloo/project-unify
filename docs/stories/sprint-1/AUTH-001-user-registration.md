# AUTH-001: User registration with Supabase

**Type:** Authentication  
**Points:** 4  
**Priority:** P0 (Blocker)  
**Dependencies:** TECH-002, TECH-004  

## Description
Implement basic user registration flow using Supabase Auth with email verification. Create a simple self-registration process for MVP, deferring invitation system to Sprint 2.

## Acceptance Criteria
- [ ] Registration page with form
- [ ] Email/password registration working
- [ ] Email verification flow complete
- [ ] User profile created on registration
- [ ] Basic club creation for first user
- [ ] Error handling for common cases
- [ ] Registration UI components
- [ ] Success/error messaging
- [ ] Redirect to dashboard after verification

## Technical Details

### Registration Flow (Simplified for MVP)
1. User navigates to /register
2. Enters email, password, name, club name
3. Supabase creates auth user
4. Database trigger creates user profile
5. Creates new club and UserClubRole entry
6. Email verification sent via Supabase
7. User redirected to verify page
8. After verification, redirect to dashboard

### Server Action Implementation (Simplified)
```typescript
// apps/web/src/lib/auth/actions.ts
'use server'

export async function registerUser(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const clubName = formData.get('clubName') as string;
  
  // Create Supabase user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
    }
  });
  
  if (authError) {
    return { error: authError.message };
  }
  
  // Create club and association (via database function)
  const { error: dbError } = await supabase.rpc('create_club_with_owner', {
    user_id: authData.user!.id,
    club_name: clubName,
    user_role: 'admin'
  });
  
  if (dbError) {
    return { error: 'Failed to create club' };
  }
  
  return { success: true };
}
```

### Frontend Components
```typescript
// apps/web/src/app/(auth)/register/page.tsx
export default function RegisterPage() {
  return (
    <AuthLayout>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>
            Start your free trial of the Soccer Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

// apps/web/src/components/auth/register-form.tsx
export function RegisterForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  
  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await registerUser(formData);
      if (result.error) {
        setError(result.error);
      } else {
        router.push('/verify-email');
      }
    });
  }
  
  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="coach@club.com"
        />
      </div>
      
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          placeholder="••••••••"
        />
      </div>
      
      <div>
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="John Smith"
        />
      </div>
      
      <div>
        <Label htmlFor="clubName">Club Name</Label>
        <Input
          id="clubName"
          name="clubName"
          required
          placeholder="FC United"
        />
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Creating account...' : 'Create account'}
      </Button>
      
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
```

## Implementation Steps
1. Configure Supabase Auth settings
2. Create database trigger for user profiles
3. Create RPC function for club creation
4. Build registration page and form
5. Implement server action
6. Create email verification page
7. Add auth callback handler
8. Test full flow end-to-end

## Database Function
```sql
-- Create function to handle club creation with owner
CREATE OR REPLACE FUNCTION create_club_with_owner(
  user_id UUID,
  club_name TEXT,
  user_role user_role_type DEFAULT 'admin'
)
RETURNS void AS $$
DECLARE
  new_club_id UUID;
BEGIN
  -- Create club
  INSERT INTO clubs (name, created_by)
  VALUES (club_name, user_id)
  RETURNING id INTO new_club_id;
  
  -- Create user-club association
  INSERT INTO user_club_roles (user_id, club_id, role, is_primary, permissions)
  VALUES (
    user_id,
    new_club_id,
    user_role,
    true,
    '{"all": true}'::jsonb
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Testing
- New user can register with valid details
- Duplicate email shows appropriate error
- Weak password rejected (min 8 chars)
- Email verification required before access
- Profile and club created correctly
- User redirected to dashboard after verification
- Form validation works properly

## Security Considerations
- Rate limit registration attempts (5 per hour per IP)
- Password requirements enforced by Supabase
- CAPTCHA for public registration (future)
- Log registration attempts
- Sanitize club name input

## Notes
- Invitation system deferred to Sprint 2
- Social login in future sprint
- Add password strength indicator
- Consider magic link option
- Track registration analytics