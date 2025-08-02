# Row Level Security (RLS) Policies

This document describes the Row Level Security policies implemented in the Project Unify database.

## Overview

Row Level Security (RLS) ensures that users can only access data they're authorized to see. All database tables have RLS enabled with specific policies for different user roles.

## User Roles

- **Admin**: Full access to club data
- **Head Coach**: Manage teams, sessions, and players
- **Assistant Coach**: Same as head coach but with club-admin approval
- **Parent**: View their children's data and evaluations

## Policy Summary

### Users Table
- Users can view and update their own profile
- Authentication based on Supabase auth.uid()

### Clubs
- Users can view clubs they belong to (active membership required)
- Admins and head coaches can update club settings

### Teams
- Users can view teams in their clubs
- Coaches can create and manage teams

### Players
- Club members can view players in their teams
- Parents can view their own children
- Coaches can add and update player information

### Sessions
- Club members can view sessions
- Coaches can create and manage training sessions

### Attendance
- Club members can view attendance records
- Coaches can manage attendance

### Drills
- All authenticated users can view public drills
- Club members can view club-specific drills
- Coaches can create and manage drills

### Templates
- Club members can view session templates
- Coaches can create and manage templates

### Evaluations
- Coaches can create and manage player evaluations
- Parents can view their children's evaluations

### Curriculums
- All authenticated users can view curriculums

## Testing RLS Policies

To verify RLS is working correctly:

1. Sign up as different user types (coach, parent)
2. Try accessing different resources
3. Verify access is properly restricted

## Applying RLS Policies

Run the following command to apply RLS policies:

```bash
pnpm db:rls
```

## Important Notes

1. **Service Role**: The Supabase service role key bypasses RLS. Only use it in secure server environments.

2. **Testing**: Always test new features with different user roles to ensure proper access control.

3. **Performance**: RLS policies add a small overhead to queries. Complex policies may impact performance.

4. **Debugging**: If you encounter access issues:
   - Check the user's role in user_clubs table
   - Verify the user's authentication status
   - Review the specific policy that might be blocking access

## Modifying Policies

To modify RLS policies:

1. Update the SQL file at `prisma/migrations/rls-policies.sql`
2. Drop existing policies if needed
3. Run `pnpm db:rls` to apply changes

## Security Best Practices

1. Always use parameterized queries
2. Never expose service role keys in client code
3. Regularly audit access patterns
4. Keep policies as simple as possible for performance
5. Test thoroughly with different user scenarios