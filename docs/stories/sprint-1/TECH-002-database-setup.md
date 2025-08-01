# TECH-002: Initialize database and schema

**Type:** Technical Foundation  
**Points:** 3  
**Priority:** P0 (Blocker)  
**Dependencies:** TECH-001  

## Description
Set up Supabase project and initialize the database schema with Prisma ORM. Create the foundational tables for multi-tenant architecture with proper RLS policies.

## Acceptance Criteria
- [ ] Supabase project created and configured
- [ ] Prisma schema defined with all core models
- [ ] Database migrations created and applied
- [ ] Row Level Security (RLS) policies implemented
- [ ] Seed data script for development
- [ ] Database connection configured in API
- [ ] Prisma Client generation working
- [ ] Basic CRUD operations tested

## Technical Details

### Core Database Models
```prisma
model Club {
  id            String   @id @default(cuid())
  name          String
  settings      Json     @default("{}")
  subscription  String   @default("trial")
  createdAt     DateTime @default(now())
  
  teams         Team[]
  users         UserClubRole[]
  curriculum    Curriculum?
}

model UserClubRole {
  id            String   @id @default(cuid())
  userId        String
  clubId        String
  role          Role
  isPrimary     Boolean  @default(false)
  permissions   Json
  
  club          Club     @relation(fields: [clubId], references: [id])
  user          User     @relation(fields: [userId], references: [id])
  
  @@unique([userId, clubId, role])
}

model Team {
  id            String   @id @default(cuid())
  clubId        String
  name          String
  ageGroup      String
  season        String
  
  club          Club     @relation(fields: [clubId], references: [id])
  sessions      Session[]
  players       TeamMember[]
}

model Session {
  id            String   @id @default(cuid())
  teamId        String
  date          DateTime
  duration      Int      // minutes
  status        SessionStatus
  plan          Json
  
  team          Team     @relation(fields: [teamId], references: [id])
  createdBy     String
  approvedBy    String?
}
```

### RLS Policies Examples
```sql
-- Users can only see clubs they belong to
CREATE POLICY club_access ON clubs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_club_roles
      WHERE club_id = clubs.id
      AND user_id = auth.uid()
    )
  );

-- Sessions follow team access
CREATE POLICY session_access ON sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN user_club_roles ucr ON ucr.club_id = t.club_id
      WHERE t.id = sessions.team_id
      AND ucr.user_id = auth.uid()
    )
  );
```

## Implementation Steps
1. Create Supabase project
2. Initialize Prisma in API workspace
3. Define complete schema
4. Generate initial migration
5. Write RLS policies
6. Create seed script
7. Test with Prisma Studio
8. Document connection setup

## Testing
- Run migrations: `pnpm db:migrate`
- Seed database: `pnpm db:seed`
- Open Prisma Studio: `pnpm db:studio`
- Test RLS with different user contexts
- Verify multi-tenant isolation

## Notes
- Use Supabase Auth for user management
- Enable pgvector extension for future AI features
- Set up database backups from day 1
- Document RLS testing procedures