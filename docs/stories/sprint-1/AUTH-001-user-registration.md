# AUTH-001: User registration with Supabase

**Type:** Authentication  
**Points:** 5  
**Priority:** P0 (Blocker)  
**Dependencies:** TECH-002  

## Description
Implement user registration flow using Supabase Auth, including email verification and initial profile creation. Support the invitation-based registration model where clubs invite users.

## Acceptance Criteria
- [ ] Registration API endpoint implemented
- [ ] Email/password registration working
- [ ] Email verification flow complete
- [ ] User profile created on registration
- [ ] Invitation token validation
- [ ] Error handling for common cases
- [ ] Registration UI components
- [ ] Success/error messaging
- [ ] Redirect to appropriate dashboard

## Technical Details

### Registration Flow
1. User receives invitation email with token
2. Clicks link to registration page
3. Token validates and pre-fills club/role
4. User enters email, password, name
5. Supabase creates auth user
6. Trigger creates user profile
7. Creates UserClubRole entry
8. Email verification sent
9. User redirected to verify page

### API Implementation
```typescript
// apps/api/src/routers/auth.ts
export const authRouter = router({
  register: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
      inviteToken: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Validate invitation token
      const invite = await validateInvite(input.inviteToken);
      if (!invite) throw new TRPCError({ code: 'BAD_REQUEST' });
      
      // Create Supabase user
      const { data: authUser, error } = await ctx.supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: { name: input.name }
        }
      });
      
      if (error) throw new TRPCError({ code: 'BAD_REQUEST' });
      
      // Profile created via database trigger
      // Create club association
      await ctx.db.userClubRole.create({
        data: {
          userId: authUser.user.id,
          clubId: invite.clubId,
          role: invite.role,
          isPrimary: true,
        }
      });
      
      return { success: true };
    }),
});
```

### Frontend Components
```typescript
// apps/web/src/components/auth/register-form.tsx
export function RegisterForm({ inviteToken }: Props) {
  const register = api.auth.register.useMutation({
    onSuccess: () => {
      router.push('/verify-email');
    }
  });
  
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { inviteToken }
  });
  
  return (
    <Form {...form} onSubmit={form.handleSubmit(register.mutate)}>
      <FormField name="email" label="Email" type="email" />
      <FormField name="password" label="Password" type="password" />
      <FormField name="name" label="Full Name" />
      <Button type="submit" loading={register.isLoading}>
        Create Account
      </Button>
    </Form>
  );
}
```

## Implementation Steps
1. Set up Supabase Auth in project
2. Create database trigger for profiles
3. Implement invitation validation
4. Build registration API endpoint
5. Create registration UI components
6. Add email verification page
7. Set up error handling
8. Test full flow end-to-end

## Testing
- Valid invitation allows registration
- Invalid invitation shows error
- Duplicate email prevented
- Weak password rejected
- Email verification required
- Profile created correctly
- Club association established

## Security Considerations
- Rate limit registration attempts
- Validate invitation hasn't been used
- Secure password requirements
- CAPTCHA for public registration (future)
- Log registration attempts

## Notes
- Support social login in future sprint
- Add password strength indicator
- Consider magic link option
- Track registration analytics