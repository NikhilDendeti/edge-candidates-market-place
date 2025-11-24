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
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'India',
  nirf_ranking INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_college UNIQUE (name, degree, branch)
);

COMMENT ON TABLE colleges IS 'Educational institutions where students are enrolled';
COMMENT ON COLUMN colleges.nirf_ranking IS 'NIRF ranking of the college (nullable if not ranked)';

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
  nxtwave_user_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  gender VARCHAR(20),
  resume_url TEXT,
  graduation_year INTEGER,
  cgpa NUMERIC(4,2) CHECK (cgpa >= 0 AND cgpa <= 10),
  college_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_students_college FOREIGN KEY (college_id) REFERENCES colleges(college_id) ON DELETE SET NULL
);

COMMENT ON TABLE students IS 'Individual candidates/students in the marketplace';
COMMENT ON COLUMN students.nxtwave_user_id IS 'Primary key - Unique identifier from NxtWave system';
COMMENT ON COLUMN students.cgpa IS 'Cumulative Grade Point Average (0-10 scale)';

-- 4. Assessment Table
-- Represents assessment events taken by students
CREATE TABLE assessments (
  assessment_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE NOT NULL,
  report_url TEXT,
  total_student_score NUMERIC(10,2),
  total_assessment_score NUMERIC(10,2),
  percent NUMERIC(5,2) CHECK (percent >= 0 AND percent <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_assessments_student FOREIGN KEY (student_id) REFERENCES students(nxtwave_user_id) ON DELETE CASCADE
);

COMMENT ON TABLE assessments IS 'Assessment events completed by students';
COMMENT ON COLUMN assessments.percent IS 'Percentage score (0-100)';

-- 5. AssessmentScore Table
-- Normalized breakdown of scores by type for each assessment
CREATE TABLE assessment_scores (
  assessment_score_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL,
  score_type_id UUID NOT NULL,
  score NUMERIC(10,2) NOT NULL,
  max_score NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_assessment_score_type UNIQUE (assessment_id, score_type_id),
  CONSTRAINT fk_assessment_scores_assessment FOREIGN KEY (assessment_id) REFERENCES assessments(assessment_id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_scores_score_type FOREIGN KEY (score_type_id) REFERENCES score_types(score_type_id)
);

COMMENT ON TABLE assessment_scores IS 'Detailed score breakdown by type for each assessment';
COMMENT ON CONSTRAINT unique_assessment_score_type ON assessment_scores IS 'One score per type per assessment';

-- 6. Interview Table
-- Represents interview events for students
CREATE TABLE interviews (
  interview_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  interview_date TIMESTAMP WITH TIME ZONE NOT NULL,
  recording_url TEXT,
  self_intro_rating NUMERIC(3,1) CHECK (self_intro_rating >= 0 AND self_intro_rating <= 5),
  -- New problem solving fields (out of 5)
  problem1_solving_rating NUMERIC(3,1) CHECK (problem1_solving_rating >= 0 AND problem1_solving_rating <= 5),
  problem1_solving_rating_code TEXT,
  problem2_solving_rating NUMERIC(3,1) CHECK (problem2_solving_rating >= 0 AND problem2_solving_rating <= 5),
  problem2_solving_rating_code TEXT,
  -- Communication rating (updated to 0-5 scale)
  communication_rating NUMERIC(3,1) CHECK (communication_rating >= 0 AND communication_rating <= 5),
  -- New theory fields (out of 5)
  "DSA_Theory" NUMERIC(3,1) CHECK ("DSA_Theory" >= 0 AND "DSA_Theory" <= 5),
  "Core_CS_Theory" NUMERIC(3,1) CHECK ("Core_CS_Theory" >= 0 AND "Core_CS_Theory" <= 5),
  -- Overall score (out of 100)
  overall_interview_score_out_of_100 NUMERIC(5,2) CHECK (overall_interview_score_out_of_100 >= 0 AND overall_interview_score_out_of_100 <= 100),
  overall_label VARCHAR(50) CHECK (overall_label IN ('Strong Hire', 'Medium Fit', 'Consider')),
  notes TEXT,
  -- Deprecated fields (kept for backward compatibility)
  problem_solving_rating NUMERIC(3,1) CHECK (problem_solving_rating >= 0 AND problem_solving_rating <= 10),
  conceptual_rating NUMERIC(3,1) CHECK (conceptual_rating >= 0 AND conceptual_rating <= 10),
  overall_interview_rating NUMERIC(3,1) CHECK (overall_interview_rating >= 0 AND overall_interview_rating <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_interviews_student FOREIGN KEY (student_id) REFERENCES students(nxtwave_user_id) ON DELETE CASCADE
);

COMMENT ON TABLE interviews IS 'Interview events conducted with students';
COMMENT ON COLUMN interviews.self_intro_rating IS 'Self introduction rating (0-5 scale)';
COMMENT ON COLUMN interviews.problem1_solving_rating IS 'Problem 1 solving rating (0-5 scale)';
COMMENT ON COLUMN interviews.problem1_solving_rating_code IS 'Problem 1 code/reference identifier';
COMMENT ON COLUMN interviews.problem2_solving_rating IS 'Problem 2 solving rating (0-5 scale)';
COMMENT ON COLUMN interviews.problem2_solving_rating_code IS 'Problem 2 code/reference identifier';
COMMENT ON COLUMN interviews.communication_rating IS 'Communication skills rating (0-5 scale)';
COMMENT ON COLUMN interviews."DSA_Theory" IS 'DSA Theory rating (0-5 scale)';
COMMENT ON COLUMN interviews."Core_CS_Theory" IS 'Core CS Theory rating (0-5 scale)';
COMMENT ON COLUMN interviews.overall_interview_score_out_of_100 IS 'Overall interview performance score (0-100 scale)';
COMMENT ON COLUMN interviews.problem_solving_rating IS 'DEPRECATED: Use problem1_solving_rating and problem2_solving_rating instead. Problem solving ability rating (0-10 scale)';
COMMENT ON COLUMN interviews.conceptual_rating IS 'DEPRECATED: Use DSA_Theory and Core_CS_Theory instead. Conceptual understanding rating (0-10 scale)';
COMMENT ON COLUMN interviews.overall_interview_rating IS 'DEPRECATED: Use overall_interview_score_out_of_100 instead. Overall interview performance rating (0-10 scale)';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- College indexes
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_city ON colleges(city);
CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_colleges_nirf_ranking ON colleges(nirf_ranking);

-- ScoreType indexes
CREATE INDEX IF NOT EXISTS idx_score_types_key ON score_types(key);

-- Student indexes
-- Note: nxtwave_user_id is the primary key, so it's automatically indexed
CREATE INDEX IF NOT EXISTS idx_students_college_id ON students(college_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_graduation_year ON students(graduation_year);

-- Assessment indexes
CREATE INDEX IF NOT EXISTS idx_assessments_student_id ON assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessments_taken_at ON assessments(taken_at);

-- AssessmentScore indexes
CREATE INDEX IF NOT EXISTS idx_assessment_scores_assessment_id ON assessment_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_score_type_id ON assessment_scores(score_type_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scores_composite ON assessment_scores(assessment_id, score_type_id);

-- Interview indexes
CREATE INDEX IF NOT EXISTS idx_interviews_student_id ON interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_interview_date ON interviews(interview_date);
CREATE INDEX IF NOT EXISTS idx_interviews_overall_label ON interviews(overall_label);

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

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Insert sample score types
INSERT INTO score_types (key, display_name, description) VALUES
('coding', 'Coding', 'Programming and coding skills assessment'),
('dsa', 'Data Structures & Algorithms', 'DSA problem solving ability'),
('cs_fund', 'CS Fundamentals', 'Computer Science fundamental concepts'),
('quant', 'Quantitative', 'Quantitative aptitude and reasoning'),
('verbal', 'Verbal', 'Verbal communication and language skills'),
('logical', 'Logical Reasoning', 'Logical thinking and reasoning ability')
ON CONFLICT (key) DO NOTHING;

-- Insert sample colleges
INSERT INTO colleges (name, degree, branch, city, state, country, nirf_ranking) VALUES
('IIIT Hyderabad', 'B.Tech', 'Computer Science', 'Hyderabad', 'Telangana', 'India', 1),
('IIIT Bangalore', 'B.Tech', 'Information Technology', 'Bangalore', 'Karnataka', 'India', 2),
('IIIT Delhi', 'B.Tech', 'Electronics & Communication', 'Delhi', 'Delhi', 'India', 3)
ON CONFLICT (name, degree, branch) DO NOTHING;

-- Migration complete!
-- Note: Sample student, assessment, and interview data should be inserted
-- after the tables are created, referencing the college_ids from above inserts.

