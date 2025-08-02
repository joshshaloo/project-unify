-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculums ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = "supabaseId");

-- Users can update their own data
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = "supabaseId");

-- UserClub policies
-- Users can view clubs they belong to
CREATE POLICY "Users can view their club memberships" ON user_clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = user_clubs."userId" 
      AND users."supabaseId" = auth.uid()
    )
  );

-- Club policies
-- Users can view clubs they belong to
CREATE POLICY "Users can view clubs they belong to" ON clubs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = clubs.id
      AND users."supabaseId" = auth.uid()
      AND user_clubs.status = 'active'
    )
  );

-- Admins and head coaches can update their clubs
CREATE POLICY "Admins can update clubs" ON clubs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = clubs.id
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Team policies
-- Users can view teams in their clubs
CREATE POLICY "Users can view teams in their clubs" ON teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = teams."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.status = 'active'
    )
  );

-- Coaches can manage teams
CREATE POLICY "Coaches can insert teams" ON teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = teams."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

CREATE POLICY "Coaches can update teams" ON teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = teams."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Player policies
-- Users can view players in teams they have access to
CREATE POLICY "Users can view players in their teams" ON players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN user_clubs ON user_clubs."clubId" = teams."clubId"
      JOIN users ON users.id = user_clubs."userId"
      WHERE teams.id = players."teamId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.status = 'active'
    )
  );

-- Parents can view their own children
CREATE POLICY "Parents can view their children" ON players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = players."userId"
      AND users."supabaseId" = auth.uid()
    )
  );

-- Coaches can manage players
CREATE POLICY "Coaches can insert players" ON players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      JOIN user_clubs ON user_clubs."clubId" = teams."clubId"
      JOIN users ON users.id = user_clubs."userId"
      WHERE teams.id = players."teamId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

CREATE POLICY "Coaches can update players" ON players
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams
      JOIN user_clubs ON user_clubs."clubId" = teams."clubId"
      JOIN users ON users.id = user_clubs."userId"
      WHERE teams.id = players."teamId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Session policies
-- Users can view sessions for their clubs
CREATE POLICY "Users can view club sessions" ON sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = sessions."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.status = 'active'
    )
  );

-- Coaches can manage sessions
CREATE POLICY "Coaches can insert sessions" ON sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = sessions."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

CREATE POLICY "Coaches can update sessions" ON sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = sessions."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Session attendance policies
-- Users can view attendance for sessions they have access to
CREATE POLICY "Users can view session attendance" ON session_attendances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN user_clubs ON user_clubs."clubId" = sessions."clubId"
      JOIN users ON users.id = user_clubs."userId"
      WHERE sessions.id = session_attendances."sessionId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.status = 'active'
    )
  );

-- Coaches can manage attendance
CREATE POLICY "Coaches can manage attendance" ON session_attendances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN user_clubs ON user_clubs."clubId" = sessions."clubId"
      JOIN users ON users.id = user_clubs."userId"
      WHERE sessions.id = session_attendances."sessionId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Drill policies
-- Public drills are viewable by all authenticated users
CREATE POLICY "Users can view public drills" ON drills
  FOR SELECT USING ("isPublic" = true AND auth.uid() IS NOT NULL);

-- Users can view drills from their clubs
CREATE POLICY "Users can view club drills" ON drills
  FOR SELECT USING (
    "clubId" IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = drills."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.status = 'active'
    )
  );

-- Coaches can manage club drills
CREATE POLICY "Coaches can manage drills" ON drills
  FOR ALL USING (
    "clubId" IS NOT NULL AND EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = drills."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Session template policies
-- Users can view templates from their clubs
CREATE POLICY "Users can view club templates" ON session_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = session_templates."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.status = 'active'
    )
  );

-- Coaches can manage templates
CREATE POLICY "Coaches can manage templates" ON session_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = session_templates."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Player evaluation policies
-- Coaches can view and manage evaluations
CREATE POLICY "Coaches can manage evaluations" ON player_evaluations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM sessions
      JOIN user_clubs ON user_clubs."clubId" = sessions."clubId"
      JOIN users ON users.id = user_clubs."userId"
      WHERE sessions.id = player_evaluations."sessionId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach', 'assistant_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Parents can view their children's evaluations
CREATE POLICY "Parents can view child evaluations" ON player_evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM players
      JOIN users ON users.id = players."userId"
      WHERE players.id = player_evaluations."playerId"
      AND users."supabaseId" = auth.uid()
    )
  );

-- Curriculum policies
-- All authenticated users can view curriculums
CREATE POLICY "Users can view curriculums" ON curriculums
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Invitation policies
-- Enable RLS on invitations table
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Admins and head coaches can view invitations for their clubs
CREATE POLICY "Users can view club invitations" ON invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = invitations."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Admins and head coaches can create invitations
CREATE POLICY "Users can create club invitations" ON invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = invitations."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Admins and head coaches can update invitations (cancel)
CREATE POLICY "Users can update club invitations" ON invitations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_clubs
      JOIN users ON users.id = user_clubs."userId"
      WHERE user_clubs."clubId" = invitations."clubId"
      AND users."supabaseId" = auth.uid()
      AND user_clubs.role IN ('admin', 'head_coach')
      AND user_clubs.status = 'active'
    )
  );

-- Note: Additional policies for service role
-- The service role bypasses RLS, so these policies only apply to authenticated users
-- Make sure to use the service role key only in secure server-side environments