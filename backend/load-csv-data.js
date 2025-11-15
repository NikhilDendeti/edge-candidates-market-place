#!/usr/bin/env node

/**
 * CSV Data Loader for Supabase
 * Loads candidate data from CSV into normalized schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl, supabaseKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseKey = line.split('=')[1].trim(); // This is actually the service role key
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      // Anon key
    }
  });
}

const projectRef = 'bofigngwdgezilhzawqd';
supabaseUrl = `https://${projectRef}.supabase.co`;

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// CSV file path
const csvPath = path.join(__dirname, '..', 'NxtWave Edge - Shortlisted Candidates - Shortlisted Candidates.csv');

// Parse CSV (simple parser)
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() || '';
      });
      rows.push(row);
    }
  }

  return rows;
}

// Parse CSV line handling quoted values
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

// Generate UUID for nxtwave_user_id
function generateUserId() {
  return randomUUID();
}

// Score type mapping
const scoreTypeMap = {
  'coding': 'coding',
  'dsa': 'dsa',
  'cs_fund': 'cs_fund',
  'quant': 'quant',
  'verbal': 'verbal',
  'logical': 'logical'
};

async function loadData() {
  console.log('🚀 Starting CSV data load...\n');

  try {
    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCSV(csvContent);
    
    console.log(`📊 Found ${rows.length} records to process\n`);

    // Get score type IDs
    const { data: scoreTypes, error: stError } = await supabase
      .from('score_types')
      .select('score_type_id, key');

    if (stError) throw stError;

    const scoreTypeIds = {};
    scoreTypes.forEach(st => {
      scoreTypeIds[st.key] = st.score_type_id;
    });

    console.log('✅ Loaded score types\n');

    // Process each row
    const collegeCache = {}; // Cache college IDs
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        console.log(`Processing ${i + 1}/${rows.length}: ${row.full_name || 'Unknown'}`);

        // 1. Handle College
        const collegeKey = `${row.college_name}|${row.college_degree}|${row.branch}`;
        let collegeId;

        if (collegeCache[collegeKey]) {
          collegeId = collegeCache[collegeKey];
        } else {
          // Insert or get college
          const { data: existingCollege } = await supabase
            .from('colleges')
            .select('college_id')
            .eq('name', row.college_name)
            .eq('degree', row.college_degree)
            .eq('branch', row.branch)
            .single();

          if (existingCollege) {
            collegeId = existingCollege.college_id;
          } else {
            const { data: newCollege, error: collegeError } = await supabase
              .from('colleges')
              .insert({
                name: row.college_name,
                degree: row.college_degree,
                branch: row.branch,
                nirf_ranking: null // CSV doesn't have NIRF ranking
              })
              .select('college_id')
              .single();

            if (collegeError) throw collegeError;
            collegeId = newCollege.college_id;
          }
          collegeCache[collegeKey] = collegeId;
        }

        // 2. Handle Student
        // Generate UUID for nxtwave_user_id (CSV doesn't have it, so we generate one)
        const nxtwaveUserId = row['Nxtwave User ID'] || generateUserId();
        
        const { data: existingStudent } = await supabase
          .from('students')
          .select('nxtwave_user_id')
          .eq('nxtwave_user_id', nxtwaveUserId)
          .single();

        if (!existingStudent) {
          const { error: studentError } = await supabase
            .from('students')
            .insert({
              nxtwave_user_id: nxtwaveUserId,
              full_name: row.full_name,
              phone: row.phone || null,
              email: row.email || null,
              gender: row.gender || null,
              resume_url: row.resume_url || null,
              graduation_year: row.graduation_year ? parseInt(row.graduation_year) : null,
              cgpa: row.cgpa ? parseFloat(row.cgpa) : null,
              college_id: collegeId
            });

          if (studentError) throw studentError;
        }

        // 3. Handle Assessment
        // Create assessment if we have assessment data (scores or report_url)
        const hasAssessmentData = row.report_url || row.total_student_score || row.percent;
        
        if (hasAssessmentData) {
          // Use taken_at if available, otherwise use interview_date, or current timestamp
          const takenAt = row.taken_at || row.interview_date || new Date().toISOString();
          
          // Check if assessment already exists for this student
          const { data: existingAssessments } = await supabase
            .from('assessments')
            .select('assessment_id')
            .eq('student_id', nxtwaveUserId)
            .order('taken_at', { ascending: false })
            .limit(1);

          let assessmentId;
          if (existingAssessments && existingAssessments.length > 0) {
            assessmentId = existingAssessments[0].assessment_id;
          } else {
            const { data: newAssessment, error: assessmentError } = await supabase
              .from('assessments')
              .insert({
                student_id: nxtwaveUserId,
                taken_at: takenAt,
                report_url: row.report_url || null,
                total_student_score: row.total_student_score ? parseFloat(row.total_student_score) : null,
                total_assessment_score: row.total_assessment_score ? parseFloat(row.total_assessment_score) : null,
                percent: row.percent ? parseFloat(row.percent) : null
              })
              .select('assessment_id')
              .single();

            if (assessmentError) {
              console.warn(`  ⚠️  Warning inserting assessment:`, assessmentError.message);
              continue; // Skip assessment scores if assessment creation failed
            }
            assessmentId = newAssessment.assessment_id;
          }

          // 4. Handle Assessment Scores
          const scoreFields = [
            { key: 'coding', score: 'coding_score', max: 'coding_max' },
            { key: 'dsa', score: 'dsa_score', max: 'dsa_max' },
            { key: 'cs_fund', score: 'cs_fund_score', max: 'cs_fund_max' },
            { key: 'quant', score: 'quant_score', max: 'quant_max' },
            { key: 'verbal', score: 'verbal_score', max: 'verbal_max' },
            { key: 'logical', score: 'logical_score', max: 'logical_max' }
          ];

          for (const field of scoreFields) {
            const scoreValue = row[field.score];
            const maxValue = row[field.max];

            if (scoreValue && maxValue && scoreTypeIds[field.key]) {
              // Check if score already exists
              const { data: existingScore } = await supabase
                .from('assessment_scores')
                .select('assessment_score_id')
                .eq('assessment_id', assessmentId)
                .eq('score_type_id', scoreTypeIds[field.key])
                .single();

              if (!existingScore) {
                const { error: scoreError } = await supabase
                  .from('assessment_scores')
                  .insert({
                    assessment_id: assessmentId,
                    score_type_id: scoreTypeIds[field.key],
                    score: parseFloat(scoreValue),
                    max_score: parseFloat(maxValue)
                  });

                if (scoreError) {
                  console.warn(`  ⚠️  Warning inserting ${field.key} score:`, scoreError.message);
                }
              }
            }
          }
        }

        // 5. Handle Interview
        if (row.interview_date) {
          const { data: existingInterview } = await supabase
            .from('interviews')
            .select('interview_id')
            .eq('student_id', nxtwaveUserId)
            .eq('interview_date', row.interview_date)
            .single();

          if (!existingInterview) {
            const { error: interviewError } = await supabase
              .from('interviews')
              .insert({
                student_id: nxtwaveUserId,
                interview_date: row.interview_date,
                recording_url: row.recoding_url || row.recording_url || null, // Handle typo in CSV
                self_intro_rating: row.self_intro_rating ? parseFloat(row.self_intro_rating) : null,
                problem_solving_rating: row.problem_solving_rating ? parseFloat(row.problem_solving_rating) : null,
                communication_rating: row.communication_rating ? parseFloat(row.communication_rating) : null,
                conceptual_rating: row.conceptual_rating ? parseFloat(row.conceptual_rating) : null,
                overall_interview_rating: row.overall_interview_rating ? parseFloat(row.overall_interview_rating) : null,
                overall_label: row.overall_label || null,
                notes: null
              });

            if (interviewError) {
              console.warn(`  ⚠️  Warning inserting interview:`, interviewError.message);
            }
          }
        }

        successCount++;
        console.log(`  ✅ Successfully processed\n`);

      } catch (error) {
        errorCount++;
        console.error(`  ❌ Error processing row ${i + 1}:`, error.message);
        console.error(`     Row data:`, JSON.stringify(row, null, 2));
      }
    }

    console.log('\n═══════════════════════════════════════');
    console.log('📊 Data Load Summary');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Successfully processed: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📁 Total records: ${rows.length}`);
    console.log('\n✅ Data load complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

loadData();

