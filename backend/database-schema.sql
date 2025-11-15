-- Database Schema for Edge Candidates Marketplace
-- Run this SQL in your Supabase SQL Editor to create the tables

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  college VARCHAR(255) NOT NULL,
  branch VARCHAR(255) NOT NULL,
  cgpa VARCHAR(10) NOT NULL,
  assessment_score VARCHAR(50),
  assessment_meta VARCHAR(255),
  interview_score VARCHAR(50),
  interview_meta VARCHAR(255),
  skills TEXT[], -- Array of skills
  recommendation VARCHAR(50) CHECK (recommendation IN ('Strong Hire', 'Medium Fit', 'Consider')),
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on branch for faster queries
CREATE INDEX IF NOT EXISTS idx_candidates_branch ON candidates(branch);

-- Create index on recommendation for filtering
CREATE INDEX IF NOT EXISTS idx_candidates_recommendation ON candidates(recommendation);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow public read access (adjust based on your security needs)
CREATE POLICY "Allow public read access" ON candidates
  FOR SELECT
  USING (true);

-- Optional: Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_candidates_updated_at
  BEFORE UPDATE ON candidates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for testing)
INSERT INTO candidates (name, college, branch, cgpa, assessment_score, assessment_meta, interview_score, interview_meta, skills, recommendation, resume_url) VALUES
('Aditya Sharma', 'IIIT Hyderabad', 'Computer Science', '9.41', '188 / 210', 'Last taken: 12 Oct', '9.6 / 10', 'Recorded', ARRAY['Strong Problem Solving', 'Strong DSA', 'Strong Theory'], 'Strong Hire', '#'),
('Bhavana Iyer', 'IIIT Bangalore', 'Information Technology', '9.18', '178 / 210', 'Last taken: 10 Oct', '8.7 / 10', 'Recorded', ARRAY['Strong Problem Solving', 'Strong DSA', 'Strong Communication'], 'Medium Fit', '#'),
('Charan Gupta', 'IIIT Delhi', 'Electronics & Comm.', '8.94', '82 / 100', 'Last taken: 09 Oct', '7.8 / 10', 'Recorded', ARRAY['Strong Problem Solving', 'Strong DSA'], 'Consider', NULL);

