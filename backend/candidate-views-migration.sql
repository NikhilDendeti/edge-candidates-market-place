-- Migration Script: Add candidate view tracking tables
-- Run this SQL in your Supabase SQL Editor to add user tracking functionality
-- This adds two new tables: users and candidate_views

-- ============================================================================
-- STEP 1: Drop existing tables if they exist (for idempotency)
-- ============================================================================

DROP TABLE IF EXISTS candidate_views CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- STEP 2: Create new tables
-- ============================================================================

-- 7. Users Table
-- Represents users who view candidate profiles
CREATE TABLE users (
  user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Users who view candidate profiles';
COMMENT ON COLUMN users.email IS 'Unique email address - primary identifier for users';
COMMENT ON COLUMN users.created_at IS 'First time user viewed any candidate (India timezone)';
COMMENT ON COLUMN users.updated_at IS 'Last update time (India timezone)';

-- 8. Candidate Views Table
-- Tracks which users viewed which candidates
CREATE TABLE candidate_views (
  view_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  candidate_id VARCHAR(100) NOT NULL REFERENCES students(nxtwave_user_id) ON DELETE CASCADE,
  candidate_name VARCHAR(255) NOT NULL,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE candidate_views IS 'Tracks which users viewed which candidate profiles';
COMMENT ON COLUMN candidate_views.candidate_name IS 'Denormalized candidate name for easy lookup';
COMMENT ON COLUMN candidate_views.viewed_at IS 'When the view occurred (India timezone)';
COMMENT ON COLUMN candidate_views.created_at IS 'Record creation time (India timezone)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Candidate views indexes
CREATE INDEX IF NOT EXISTS idx_candidate_views_user_id ON candidate_views(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_views_candidate_id ON candidate_views(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_views_viewed_at ON candidate_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_candidate_views_user_candidate ON candidate_views(user_id, candidate_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Apply trigger to users table for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON users;
DROP POLICY IF EXISTS "Allow public read access" ON candidate_views;

-- Create public read access policies (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON users
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON candidate_views
  FOR SELECT
  USING (true);

-- ============================================================================
-- NOTES
-- ============================================================================

-- Timezone: All timestamps are stored in India timezone (Asia/Kolkata) 
-- using TIMESTAMP WITH TIME ZONE. PostgreSQL will automatically handle
-- timezone conversions based on the server's timezone setting.

-- Design Decisions:
-- 1. candidate_name is denormalized for easy lookup without joins
-- 2. Multiple view records allowed for same user-candidate pair (different timestamps)
-- 3. Cascade delete: If user or candidate is deleted, view records are deleted
-- 4. No IP address or user agent stored for privacy

