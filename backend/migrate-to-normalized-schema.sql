-- Migration Script: Replace candidates table with normalized schema
-- Run this SQL in your Supabase SQL Editor to migrate from old to new schema
-- WARNING: This will DELETE all data in the candidates table!

-- ============================================================================
-- STEP 1: Drop old schema (candidates table and related objects)
-- ============================================================================

-- Drop the old candidates table (CASCADE will automatically drop triggers and policies)
DROP TABLE IF EXISTS candidates CASCADE;

-- Drop new tables if they exist (in reverse dependency order to avoid FK issues)
DROP TABLE IF EXISTS assessment_scores CASCADE;
DROP TABLE IF EXISTS interviews CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS score_types CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;

-- Drop the trigger function if it exists
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================================================
-- STEP 2: Create new normalized schema
-- ============================================================================

-- 1. College Table
-- Represents educational institutions where students study
CREATE TABLE colleges (
  college_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  degree VARCHAR(100) NOT NULL,
  branch VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_college UNIQUE (name, degree, branch)
);

COMMENT ON TABLE colleges IS 'Educational institutions where students are enrolled';

-- 2. ScoreType Table
-- Normalizes different types of assessment scores/metrics
CREATE TABLE score_types (
  score_type_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(50) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE score_types IS 'Types of assessment scores (coding, DSA, CS fundamentals, etc.)';
COMMENT ON COLUMN score_types.key IS 'Unique identifier key (e.g., coding, dsa, cs_fund)';

-- 3. Student Table
-- Represents individual candidates/users
CREATE TABLE students (
  user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  gender VARCHAR(20),
  resume_url TEXT,
  graduation_year INTEGER,
  cgpa NUMERIC(4,2),
  college_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_students_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL
);

COMMENT ON TABLE students IS 'Individual candidates/students in the marketplace';
COMMENT ON COLUMN students.user_id IS 'Primary key - Unique identifier for the student';
COMMENT ON COLUMN students.cgpa IS 'Cumulative Grade Point Average';

-- 4. Assessment Table
-- Represents assessment events taken by students
CREATE TABLE assessments (
  assessment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  taken_at VARCHAR(50),
  report_url TEXT,
  org_assess_id UUID,
  total_student_score NUMERIC(10,2),
  attempt_end_reason VARCHAR(255),
  proctor_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_assessments_student FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE assessments IS 'Assessment events completed by students';
COMMENT ON COLUMN assessments.taken_at IS 'Timestamp when assessment was taken (stored as string)';
COMMENT ON COLUMN assessments.org_assess_id IS 'Original assessment ID from external system';
COMMENT ON COLUMN assessments.attempt_end_reason IS 'Reason why the assessment attempt ended';
COMMENT ON COLUMN assessments.proctor_details IS 'Proctoring details stored as JSON';

-- 5. AssessmentScore Table
-- Normalized breakdown of scores by type for each assessment
CREATE TABLE assessment_scores (
  assessment_score_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  score_type_id UUID NOT NULL,
  score NUMERIC(10,2) NOT NULL,
  max_score NUMERIC(10,2) NOT NULL,
  time_spent NUMERIC(5,2),
  duration NUMERIC(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_assessment_score_type UNIQUE (assessment_id, score_type_id),
  CONSTRAINT fk_assessment_scores_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_scores_score_type FOREIGN KEY (score_type_id) REFERENCES score_types(score_type_id) ON DELETE PROTECT
);

COMMENT ON TABLE assessment_scores IS 'Detailed score breakdown by type for each assessment';
COMMENT ON CONSTRAINT unique_assessment_score_type ON assessment_scores IS 'One score per type per assessment';
COMMENT ON COLUMN assessment_scores.time_spent IS 'Time spent on this score type (in minutes)';
COMMENT ON COLUMN assessment_scores.duration IS 'Duration allocated for this score type (in minutes)';

-- 6. Interview Table
-- Represents interview events for students
CREATE TABLE interviews (
  interview_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  interview_date VARCHAR(50),
  recording_url TEXT,
  communication_rating INTEGER,
  core_cs_theory_rating INTEGER,
  dsa_theory_rating INTEGER,
  problem1_solving_rating INTEGER,
  problem1_code_implementation_rating INTEGER,
  problem2_solving_rating INTEGER,
  problem2_code_implementation_rating INTEGER,
  overall_interview_score_out_of_100 NUMERIC(5,2),
  notes TEXT,
  audit_final_status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_interviews_student FOREIGN KEY (student_id) REFERENCES students(user_id) ON DELETE CASCADE
);

COMMENT ON TABLE interviews IS 'Interview events conducted with students';
COMMENT ON COLUMN interviews.interview_date IS 'Date when interview was conducted (stored as string)';
COMMENT ON COLUMN interviews.communication_rating IS 'Communication skills rating';
COMMENT ON COLUMN interviews.core_cs_theory_rating IS 'Core CS Theory rating';
COMMENT ON COLUMN interviews.dsa_theory_rating IS 'DSA Theory rating';
COMMENT ON COLUMN interviews.problem1_solving_rating IS 'Problem 1 solving rating';
COMMENT ON COLUMN interviews.problem1_code_implementation_rating IS 'Problem 1 code implementation rating';
COMMENT ON COLUMN interviews.problem2_solving_rating IS 'Problem 2 solving rating';
COMMENT ON COLUMN interviews.problem2_code_implementation_rating IS 'Problem 2 code implementation rating';
COMMENT ON COLUMN interviews.overall_interview_score_out_of_100 IS 'Overall interview performance score (out of 100)';
COMMENT ON COLUMN interviews.audit_final_status IS 'Final audit status of the interview';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- College indexes
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);

-- Student indexes
-- Note: user_id is the primary key, so it's automatically indexed
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_graduation_year ON students(graduation_year);

-- Interview indexes
CREATE INDEX IF NOT EXISTS idx_interviews_student_id ON interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interview_date ON interviews(interview_date);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON colleges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON colleges;
DROP POLICY IF EXISTS "Allow public read access" ON score_types;
DROP POLICY IF EXISTS "Allow public read access" ON students;
DROP POLICY IF EXISTS "Allow public read access" ON assessments;
DROP POLICY IF EXISTS "Allow public read access" ON assessment_scores;
DROP POLICY IF EXISTS "Allow public read access" ON interviews;

-- Create public read access policies (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON colleges
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON score_types
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON students
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON assessments
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON assessment_scores
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access" ON interviews
  FOR SELECT
  USING (true);
