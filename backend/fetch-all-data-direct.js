/**
 * Script to fetch ALL data directly from Supabase database
 * This bypasses the API and gets raw data from the database
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
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL or VITE_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env file or environment variables.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fetchAllData() {
  console.log('🚀 Fetching all data directly from Supabase database...\n');
  console.log(`📡 Supabase URL: ${supabaseUrl}\n`);

  const allData = {
    timestamp: new Date().toISOString(),
    supabaseUrl: supabaseUrl,
    tables: {},
    counts: {},
    sampleData: {}
  };

  try {
    // 1. Get counts from all tables
    console.log('1️⃣ Getting record counts from all tables...');
    const collegesCount = await supabase.from('colleges').select('*', { count: 'exact', head: true });
    const studentsCount = await supabase.from('students').select('*', { count: 'exact', head: true });
    const assessmentsCount = await supabase.from('assessments').select('*', { count: 'exact', head: true });
    const assessmentScoresCount = await supabase.from('assessment_scores').select('*', { count: 'exact', head: true });
    const interviewsCount = await supabase.from('interviews').select('*', { count: 'exact', head: true });
    const scoreTypesCount = await supabase.from('score_types').select('*', { count: 'exact', head: true });
    
    let usersCount = { count: 0 };
    try {
      usersCount = await supabase.from('users').select('*', { count: 'exact', head: true });
    } catch (e) {
      // Users table might not exist
    }

    allData.counts = {
      colleges: collegesCount.count || 0,
      students: studentsCount.count || 0,
      assessments: assessmentsCount.count || 0,
      assessmentScores: assessmentScoresCount.count || 0,
      interviews: interviewsCount.count || 0,
      scoreTypes: scoreTypesCount.count || 0,
      users: usersCount.count || 0
    };

    console.log('✅ Counts retrieved:');
    Object.entries(allData.counts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count}`);
    });
    console.log('');

    // 2. Fetch all colleges
    console.log('2️⃣ Fetching all colleges...');
    const { data: colleges, error: collegesError } = await supabase
      .from('colleges')
      .select('*')
      .order('name');

    if (collegesError) {
      console.error('❌ Error fetching colleges:', collegesError.message);
    } else {
      allData.tables.colleges = colleges || [];
      console.log(`✅ Fetched ${allData.tables.colleges.length} colleges\n`);
    }

    // 3. Fetch all students with full relations
    console.log('3️⃣ Fetching all students with relations...');
    const { data: students, error: studentsError } = await supabase
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
      .order('created_at', { ascending: false });

    if (studentsError) {
      console.error('❌ Error fetching students:', studentsError.message);
      console.error('   Details:', studentsError.details);
      console.error('   Hint:', studentsError.hint);
    } else {
      allData.tables.students = students || [];
      console.log(`✅ Fetched ${allData.tables.students.length} students with full relations\n`);
    }

    // 4. Fetch all assessments separately (in case nested query failed)
    console.log('4️⃣ Fetching all assessments...');
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('*')
      .order('taken_at', { ascending: false });

    if (assessmentsError) {
      console.error('❌ Error fetching assessments:', assessmentsError.message);
    } else {
      allData.tables.assessments = assessments || [];
      console.log(`✅ Fetched ${allData.tables.assessments.length} assessments\n`);
    }

    // 5. Fetch all assessment scores
    console.log('5️⃣ Fetching all assessment scores...');
    const { data: assessmentScores, error: assessmentScoresError } = await supabase
      .from('assessment_scores')
      .select(`
        *,
        score_types (*)
      `)
      .order('assessment_id');

    if (assessmentScoresError) {
      console.error('❌ Error fetching assessment scores:', assessmentScoresError.message);
    } else {
      allData.tables.assessmentScores = assessmentScores || [];
      console.log(`✅ Fetched ${allData.tables.assessmentScores.length} assessment scores\n`);
    }

    // 6. Fetch all interviews
    console.log('6️⃣ Fetching all interviews...');
    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .select('*')
      .order('interview_date', { ascending: false });

    if (interviewsError) {
      console.error('❌ Error fetching interviews:', interviewsError.message);
    } else {
      allData.tables.interviews = interviews || [];
      console.log(`✅ Fetched ${allData.tables.interviews.length} interviews\n`);
    }

    // 7. Fetch all score types
    console.log('7️⃣ Fetching all score types...');
    const { data: scoreTypes, error: scoreTypesError } = await supabase
      .from('score_types')
      .select('*')
      .order('key');

    if (scoreTypesError) {
      console.error('❌ Error fetching score types:', scoreTypesError.message);
    } else {
      allData.tables.scoreTypes = scoreTypes || [];
      console.log(`✅ Fetched ${allData.tables.scoreTypes.length} score types\n`);
    }

    // 8. Fetch users if table exists
    console.log('8️⃣ Fetching users (if table exists)...');
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (!usersError && users) {
        allData.tables.users = users || [];
        console.log(`✅ Fetched ${allData.tables.users.length} users\n`);
      } else {
        console.log('⚠️  Users table not accessible or doesn\'t exist\n');
      }
    } catch (e) {
      console.log('⚠️  Users table not accessible or doesn\'t exist\n');
    }

    // 9. Get sample data for verification
    console.log('9️⃣ Getting sample data...');
    if (allData.tables.students && allData.tables.students.length > 0) {
      allData.sampleData = {
        firstStudent: allData.tables.students[0],
        totalStudents: allData.tables.students.length,
        studentsWithAssessments: allData.tables.students.filter(s => s.assessments && s.assessments.length > 0).length,
        studentsWithInterviews: allData.tables.students.filter(s => s.interviews && s.interviews.length > 0).length
      };
      console.log(`✅ Sample data collected\n`);
    }

    // 10. Save to file
    console.log('🔟 Saving data to file...');
    const outputPath = path.join(__dirname, 'all-database-data-direct.json');
    fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));
    console.log(`✅ Data saved to: ${outputPath}\n`);

    // Summary
    console.log('📊 Final Summary:');
    console.log(`   - Colleges: ${allData.counts.colleges}`);
    console.log(`   - Students: ${allData.counts.students}`);
    console.log(`   - Assessments: ${allData.counts.assessments}`);
    console.log(`   - Assessment Scores: ${allData.counts.assessmentScores}`);
    console.log(`   - Interviews: ${allData.counts.interviews}`);
    console.log(`   - Score Types: ${allData.counts.scoreTypes}`);
    console.log(`   - Users: ${allData.counts.users}`);
    console.log(`\n✨ All done! Check ${outputPath} for the complete data.\n`);
    console.log(`📁 File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB\n`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
fetchAllData();

