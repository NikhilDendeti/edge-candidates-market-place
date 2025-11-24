-- Fix RLS Policies for Service Role Access
-- This script ensures that RLS policies are correctly set up
-- Note: Service role key bypasses RLS, but these policies ensure proper access

-- ============================================================================
-- Verify RLS Status
-- ============================================================================

-- Check if RLS is enabled (should return 't' for true)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('students', 'colleges', 'assessments', 'assessment_scores', 'interviews', 'score_types', 'users', 'candidate_views')
ORDER BY tablename;

-- ============================================================================
-- Ensure RLS is enabled on all tables
-- ============================================================================

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Check if users and candidate_views tables exist and enable RLS if they do
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    ALTER TABLE users ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'candidate_views') THEN
    ALTER TABLE candidate_views ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- Drop existing policies and recreate them
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access" ON colleges;
DROP POLICY IF EXISTS "Allow public read access" ON score_types;
DROP POLICY IF EXISTS "Allow public read access" ON students;
DROP POLICY IF EXISTS "Allow public read access" ON assessments;
DROP POLICY IF EXISTS "Allow public read access" ON assessment_scores;
DROP POLICY IF EXISTS "Allow public read access" ON interviews;
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON candidate_views;

-- Drop service role policies if they exist
DROP POLICY IF EXISTS "Allow service role full access" ON colleges;
DROP POLICY IF EXISTS "Allow service role full access" ON score_types;
DROP POLICY IF EXISTS "Allow service role full access" ON students;
DROP POLICY IF EXISTS "Allow service role full access" ON assessments;
DROP POLICY IF EXISTS "Allow service role full access" ON assessment_scores;
DROP POLICY IF EXISTS "Allow service role full access" ON interviews;
DROP POLICY IF EXISTS "Allow service role full access" ON users;
DROP POLICY IF EXISTS "Allow service role full access" ON candidate_views;

-- ============================================================================
-- Create policies for anon role (for public API access if needed)
-- ============================================================================

CREATE POLICY "Allow public read access" ON colleges
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access" ON score_types
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access" ON students
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access" ON assessments
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access" ON assessment_scores
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access" ON interviews
  FOR SELECT
  TO anon
  USING (true);

-- ============================================================================
-- IMPORTANT: Service Role Key Bypasses RLS
-- ============================================================================
-- The service_role key bypasses ALL RLS policies automatically.
-- You don't need explicit policies for service_role.
-- 
-- However, if you want to be explicit (optional), you can create policies:
-- 
-- CREATE POLICY "Allow service role full access" ON students
--   FOR ALL
--   TO service_role
--   USING (true)
--   WITH CHECK (true);
--
-- But this is NOT necessary - service_role bypasses RLS by default.

-- ============================================================================
-- Verify Policies
-- ============================================================================

-- List all policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- Test Query (Run this to verify service role can access data)
-- ============================================================================

-- This should work if service role key is configured correctly
-- SELECT COUNT(*) FROM students;
-- SELECT COUNT(*) FROM colleges;
-- SELECT COUNT(*) FROM assessments;

