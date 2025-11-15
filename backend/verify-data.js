#!/usr/bin/env node

/**
 * Verify loaded data in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseKey = line.split('=')[1].trim();
    }
  });
}

const projectRef = 'bofigngwdgezilhzawqd';
const supabaseUrl = `https://${projectRef}.supabase.co`;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function verifyData() {
  console.log('🔍 Verifying loaded data...\n');

  try {
    // Count records in each table
    const [colleges, students, assessments, assessmentScores, interviews, scoreTypes] = await Promise.all([
      supabase.from('colleges').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('assessments').select('*', { count: 'exact', head: true }),
      supabase.from('assessment_scores').select('*', { count: 'exact', head: true }),
      supabase.from('interviews').select('*', { count: 'exact', head: true }),
      supabase.from('score_types').select('*', { count: 'exact', head: true })
    ]);

    console.log('📊 Data Summary:');
    console.log(`   Colleges: ${colleges.count}`);
    console.log(`   Students: ${students.count}`);
    console.log(`   Assessments: ${assessments.count}`);
    console.log(`   Assessment Scores: ${assessmentScores.count}`);
    console.log(`   Interviews: ${interviews.count}`);
    console.log(`   Score Types: ${scoreTypes.count}\n`);

    // Get sample data
    const { data: sampleStudents } = await supabase
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
      .limit(3);

    if (sampleStudents && sampleStudents.length > 0) {
      console.log('✅ Sample Data:');
      sampleStudents.forEach((student, idx) => {
        console.log(`\n${idx + 1}. ${student.full_name} (${student.nxtwave_user_id})`);
        console.log(`   College: ${student.colleges?.name || 'N/A'}`);
        console.log(`   Assessments: ${student.assessments?.length || 0}`);
        console.log(`   Interviews: ${student.interviews?.length || 0}`);
        if (student.assessments && student.assessments.length > 0) {
          const assessment = student.assessments[0];
          console.log(`   Latest Assessment: ${assessment.percent}% (${assessment.assessment_scores?.length || 0} score types)`);
        }
      });
    }

    console.log('\n✅ Verification complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyData();

