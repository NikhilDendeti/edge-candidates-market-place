-- Delete all data from all tables (keeps table structures intact)
-- WARNING: This will permanently delete all data from all tables!
-- Tables will remain but will be empty.

-- ============================================================================
-- DELETE ALL DATA (in reverse dependency order to avoid FK constraint issues)
-- ============================================================================

-- Delete from tables with foreign keys first
DELETE FROM candidate_views;
DELETE FROM assessment_scores;
DELETE FROM interviews;
DELETE FROM assessments;
DELETE FROM students;
DELETE FROM users;

-- Delete from independent tables
DELETE FROM colleges;
DELETE FROM score_types;

-- ============================================================================
-- VERIFY DELETION
-- ============================================================================

SELECT 
  'candidate_views' as table_name, COUNT(*) as count FROM candidate_views
UNION ALL
SELECT 'assessment_scores', COUNT(*) FROM assessment_scores
UNION ALL
SELECT 'interviews', COUNT(*) FROM interviews
UNION ALL
SELECT 'assessments', COUNT(*) FROM assessments
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'colleges', COUNT(*) FROM colleges
UNION ALL
SELECT 'score_types', COUNT(*) FROM score_types;

-- All counts should be 0 after deletion
-- Table structures remain intact and ready for new data

