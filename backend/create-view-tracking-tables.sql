-- Migration Script: Create View Tracking Tables (users and candidate_views)
-- Run this SQL in your Supabase SQL Editor to create the view tracking schema
-- This script creates tables for tracking which users (HR/recruiters) viewed which candidates

-- ============================================================================
-- STEP 1: Create users table
-- ============================================================================

-- Users table stores HR/recruiter information
CREATE TABLE IF NOT EXISTS users (
  user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'HR/Recruiter users who view candidate profiles';
COMMENT ON COLUMN users.user_id IS 'Primary key - Unique identifier for the user';
COMMENT ON COLUMN users.email IS 'User email address (unique, used for identification)';
COMMENT ON COLUMN users.name IS 'User full name';
COMMENT ON COLUMN users.company IS 'Company/organization name (optional)';
COMMENT ON COLUMN users.phone IS 'Phone number (optional)';

-- ============================================================================
-- STEP 2: Create candidate_views table
-- ============================================================================

-- Candidate views table tracks which users viewed which candidates
CREATE TABLE IF NOT EXISTS candidate_views (
  view_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  candidate_id VARCHAR(255) NOT NULL,  -- References students.user_id (nxtwave_user_id)
  candidate_name VARCHAR(255) NOT NULL,  -- Denormalized for historical tracking
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_candidate_views_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE candidate_views IS 'Tracks which users viewed which candidate profiles';
COMMENT ON COLUMN candidate_views.view_id IS 'Primary key - Unique identifier for the view record';
COMMENT ON COLUMN candidate_views.user_id IS 'Foreign key to users table - who viewed the candidate';
COMMENT ON COLUMN candidate_views.candidate_id IS 'References students.user_id (stores nxtwave_user_id value)';
COMMENT ON COLUMN candidate_views.candidate_name IS 'Candidate name stored denormalized for historical tracking (in case name changes)';
COMMENT ON COLUMN candidate_views.viewed_at IS 'Timestamp when the view occurred (UTC)';

-- ============================================================================
-- STEP 3: Create indexes for performance
-- ============================================================================

-- Index on users.email for fast lookups when finding/creating users
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Index on candidate_views.user_id for fast queries of user's view history
CREATE INDEX IF NOT EXISTS idx_candidate_views_user_id ON candidate_views(user_id);

-- Index on candidate_views.candidate_id for fast queries of candidate's viewers
CREATE INDEX IF NOT EXISTS idx_candidate_views_candidate_id ON candidate_views(candidate_id);

-- Index on candidate_views.viewed_at for fast sorting by date
CREATE INDEX IF NOT EXISTS idx_candidate_views_viewed_at ON candidate_views(viewed_at DESC);

-- Composite index for common query pattern: get views by user, sorted by date
CREATE INDEX IF NOT EXISTS idx_candidate_views_user_viewed_at ON candidate_views(user_id, viewed_at DESC);

-- Composite index for common query pattern: get views by candidate, sorted by date
CREATE INDEX IF NOT EXISTS idx_candidate_views_candidate_viewed_at ON candidate_views(candidate_id, viewed_at DESC);

-- ============================================================================
-- STEP 4: Create trigger for updated_at on users table
-- ============================================================================

-- Function to update updated_at timestamp (reuse existing if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Create trigger to automatically update updated_at on users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 5: Enable Row Level Security (RLS)
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_views ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS Policies
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow service role full access to users" ON users;
DROP POLICY IF EXISTS "Allow service role full access to candidate_views" ON candidate_views;

-- Policy for users table: Allow service role to INSERT, SELECT, UPDATE
-- Service role bypasses RLS, but this ensures proper access patterns
CREATE POLICY "Allow service role full access to users" ON users
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Policy for candidate_views table: Allow service role to INSERT, SELECT
CREATE POLICY "Allow service role full access to candidate_views" ON candidate_views
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('users', 'candidate_views')
ORDER BY table_name, ordinal_position;

-- Verify indexes were created
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'candidate_views')
ORDER BY tablename, indexname;

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'candidate_views')
ORDER BY tablename;

-- Verify policies were created
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
  AND tablename IN ('users', 'candidate_views')
ORDER BY tablename, policyname;

