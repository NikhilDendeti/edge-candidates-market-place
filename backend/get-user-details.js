/**
 * Script to get complete details for a specific user ID from Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function getUserDetails(userId) {
  console.log(`🔍 Fetching complete details for user ID: ${userId}\n`);

  try {
    // Fetch student with all relations
    // Note: The primary key column is 'user_id', not 'nxtwave_user_id'
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        colleges (*),
        assessments (
          *,
          assessment_scores (
            *,
            score_types (*)
          )
        ),
        interviews (*)
      `)
      .eq('user_id', userId)
      .single();

    if (studentError) {
      console.error('❌ Error fetching student:', studentError.message);
      console.error('   Details:', studentError.details);
      console.error('   Hint:', studentError.hint);
      return null;
    }

    if (!student) {
      console.error(`❌ No student found with user ID: ${userId}`);
      return null;
    }

    // Also fetch all related data separately for completeness
    // Note: assessments and interviews use 'student_id' foreign key referencing students.user_id
    const [assessmentsData, interviewsData, assessmentScoresData] = await Promise.all([
      supabase.from('assessments').select('*').eq('student_id', userId).order('taken_at', { ascending: false }),
      supabase.from('interviews').select('*').eq('student_id', userId).order('interview_date', { ascending: false }),
      supabase.from('assessment_scores')
        .select(`
          *,
          score_types (*),
          assessments!inner(student_id)
        `)
        .eq('assessments.student_id', userId)
    ]);

    const completeData = {
      timestamp: new Date().toISOString(),
      userId: userId,
      student: student,
      relatedData: {
        assessments: assessmentsData.data || [],
        interviews: interviewsData.data || [],
        assessmentScores: assessmentScoresData.data || []
      },
      summary: {
        fullName: student.full_name,
        email: student.email,
        phone: student.phone,
        cgpa: student.cgpa,
        college: student.colleges?.name || 'N/A',
        branch: student.colleges?.branch || 'N/A',
        totalAssessments: student.assessments?.length || 0,
        totalInterviews: student.interviews?.length || 0,
        graduationYear: student.graduation_year,
        gender: student.gender,
        resumeUrl: student.resume_url
      }
    };

    // Display summary
    console.log('✅ Student found!\n');
    console.log('📊 Summary:');
    console.log(`   Name: ${completeData.summary.fullName}`);
    console.log(`   Email: ${completeData.summary.email || 'N/A'}`);
    console.log(`   Phone: ${completeData.summary.phone || 'N/A'}`);
    console.log(`   CGPA: ${completeData.summary.cgpa || 'N/A'}`);
    console.log(`   College: ${completeData.summary.college}`);
    console.log(`   Branch: ${completeData.summary.branch}`);
    console.log(`   Graduation Year: ${completeData.summary.graduationYear || 'N/A'}`);
    console.log(`   Gender: ${completeData.summary.gender || 'N/A'}`);
    console.log(`   Total Assessments: ${completeData.summary.totalAssessments}`);
    console.log(`   Total Interviews: ${completeData.summary.totalInterviews}`);
    console.log(`   Resume URL: ${completeData.summary.resumeUrl || 'N/A'}\n`);

    // Display assessments
    if (completeData.summary.totalAssessments > 0) {
      console.log('📝 Assessments:');
      student.assessments?.forEach((assessment, idx) => {
        console.log(`\n   ${idx + 1}. Assessment ID: ${assessment.assessment_id}`);
        console.log(`      Taken At: ${assessment.taken_at}`);
        console.log(`      Score: ${assessment.total_student_score || 'N/A'} / ${assessment.total_assessment_score || 'N/A'}`);
        console.log(`      Percentage: ${assessment.percent || 'N/A'}%`);
        console.log(`      Report URL: ${assessment.report_url || 'N/A'}`);
        if (assessment.assessment_scores && assessment.assessment_scores.length > 0) {
          console.log(`      Score Breakdown:`);
          assessment.assessment_scores.forEach(score => {
            const scoreType = score.score_types?.display_name || score.score_types?.key || 'Unknown';
            console.log(`         - ${scoreType}: ${score.score} / ${score.max_score}`);
          });
        }
      });
      console.log('');
    }

    // Display interviews
    if (completeData.summary.totalInterviews > 0) {
      console.log('🎤 Interviews:');
      student.interviews?.forEach((interview, idx) => {
        console.log(`\n   ${idx + 1}. Interview ID: ${interview.interview_id}`);
        console.log(`      Date: ${interview.interview_date}`);
        console.log(`      Overall Score: ${interview.overall_interview_score_out_of_100 || interview.overall_interview_rating || 'N/A'}`);
        console.log(`      Overall Label: ${interview.overall_label || 'N/A'}`);
        console.log(`      Self Intro Rating: ${interview.self_intro_rating || 'N/A'}`);
        console.log(`      Problem Solving Rating: ${interview.problem1_solving_rating || interview.problem_solving_rating || 'N/A'}`);
        console.log(`      Communication Rating: ${interview.communication_rating || 'N/A'}`);
        console.log(`      DSA Theory: ${interview.DSA_Theory || 'N/A'}`);
        console.log(`      Core CS Theory: ${interview.Core_CS_Theory || 'N/A'}`);
        console.log(`      Recording URL: ${interview.recording_url || 'N/A'}`);
        if (interview.notes) {
          console.log(`      Notes: ${interview.notes.substring(0, 100)}${interview.notes.length > 100 ? '...' : ''}`);
        }
      });
      console.log('');
    }

    // Save to file
    const outputPath = path.join(__dirname, `user-${userId}-complete-details.json`);
    fs.writeFileSync(outputPath, JSON.stringify(completeData, null, 2));
    console.log(`💾 Complete data saved to: ${outputPath}\n`);

    return completeData;

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Get user ID from command line argument
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Please provide a user ID');
  console.error('Usage: node get-user-details.js <user-id>');
  process.exit(1);
}

getUserDetails(userId);

