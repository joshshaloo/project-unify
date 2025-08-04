# TECH-002: Database schema and PostgreSQL setup

**Type:** Technical Foundation  
**Points:** 3  
**Priority:** P0 (Blocker)  
**Dependencies:** TECH-001  

## Description
Configure self-hosted PostgreSQL database with Prisma ORM and implement the complete data schema including NextAuth integration and multi-tenant architecture.

## Acceptance Criteria
- [ ] PostgreSQL running in Docker containers (dev/preview/prod)
- [ ] Prisma schema matches current implementation
- [ ] NextAuth database adapter configured
- [ ] Database migrations created and tested
- [ ] Seed data script for development
- [ ] Multi-tenant data isolation implemented
- [ ] Magic links table and cleanup implemented
- [ ] Connection pooling configured
- [ ] Backup strategy documented

## Technical Details

### Current Architecture
- **Database**: Self-hosted PostgreSQL 15+ in Docker containers
- **ORM**: Prisma 5.0+ with database sessions
- **Auth Tables**: NextAuth v5 adapter tables
- **Environment Isolation**: Separate databases per environment
- **Connections**: Direct connection (no pooling for MVP)

### Core Database Models (Current Implementation)
```prisma
// From apps/web/prisma/schema.prisma (already implemented)
model Club {
  id           String    @id @default(cuid())
  name         String
  logoUrl      String?
  primaryColor String?
  settings     Json      @default("{}")
  subscription String    @default("trial")
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  userClubs   UserClub[]
  teams       Team[]
  drills      Drill[]
  sessions    Session[]
  templates   SessionTemplate[]
  invitations Invitation[]
}

model UserClub {
  id        String   @id @default(cuid())
  userId    String
  clubId    String
  role      String   // admin, head_coach, assistant_coach, parent
  status    String   @default("active") // active, inactive, invited
  joinedAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
  club Club @relation(fields: [clubId], references: [id])

  @@unique([userId, clubId])
  @@map("user_clubs")
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