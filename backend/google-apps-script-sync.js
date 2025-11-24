/***** CONFIG *****/

const CFG = {
  SHEET_NAME: 'Shortlisted Candidates',  
  HEADER_ROW: 1,

  STUDENT_FIELDS: [
    'full_name', 'phone_number', 'email', 'gender', 'resume_url',
    'graduation_year', 'cgpa', 'Nxtwave User ID', 'nxtwave_user_id'
  ],
  
  COLLEGE_FIELDS: [
    'college_name', 'college_degree', 'branch',
    'college_city', 'city', 'college_state', 'state',
    'college_country', 'country', 'nirf_ranking'
  ],
  
  ASSESSMENT_FIELDS: [
    'taken_at', 'assessment_date', 'report_url',
    'total_student_score', 'total_assessment_score', 'percent'
  ],
  
  ASSESSMENT_SCORE_FIELDS: [
    'coding_score', 'coding_max',
    'dsa_score', 'dsa_max',
    'cs_fund_score', 'cs_fund_max',
    'quant_score', 'quant_max',
    'verbal_score', 'verbal_max',
    'logical_score', 'logical_max'
  ],
  
  INTERVIEW_FIELDS: [
    'interview_date', 'recording_url', 'recoding_url',
    'self_intro_rating', 'problem_solving_rating', // DEPRECATED: Keep for backward compatibility
    'problem1_solving_rating', 'problem1_solving_rating_code',
    'problem2_solving_rating', 'problem2_solving_rating_code',
    'communication_rating', 'conceptual_rating', // DEPRECATED: Keep for backward compatibility
    'DSA_Theory', 'Core_CS_Theory',
    'overall_interview_rating', // DEPRECATED: Keep for backward compatibility
    'overall_interview_score_out_of_100',
    'overall_label',
    'interview_notes', 'notes'
  ]
};

/**
 * Partial NIRF 2025 Engineering data (city/state/rank) sourced from
 * https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html
 * Keys are normalized to lowercase for easier matching.
 */
const NIRF_DATA = {
  'Indian Institute of Information Technology Bhopal': {
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    nirfRanking: 77,
  },
  'Indian Institute of Information Technology Dharwad': {
    city: 'Dharwad',
    state: 'Karnataka',
    nirfRanking: 'Not released',
  },
  'Indian Institute of Information Technology Bhagalpur': {
    city: 'Bhagalpur',
    state: 'Bihar',
    nirfRanking: 'Not released',
  }
};


function onEditSync(e) {
  try {
    if (!e || !e.range) return;
    const sh = e.range.getSheet();
    if (!sh || sh.getName() !== CFG.SHEET_NAME) return;
    const row = e.range.getRow();
    if (row === CFG.HEADER_ROW) return;
    syncRow_(sh, row);
  } catch (err) {
    console.error('onEditSync error:', err);
  }
}

/***** Manual helpers *****/
function SyncActiveRowOnce() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_NAME);
  if (!sh) throw new Error('Sheet not found');
  const row = sh.getActiveRange().getRow();
  if (row === CFG.HEADER_ROW) throw new Error('Active row is header');
  syncRow_(sh, row);
}

function SyncAll() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CFG.SHEET_NAME);
  if (!sh) throw new Error('Sheet not found');
  const lastRow = sh.getLastRow();
  for (let r = CFG.HEADER_ROW + 1; r <= lastRow; r++) {
    try { 
      syncRow_(sh, r); 
      Utilities.sleep(100); // Small delay to avoid rate limits
    } catch (e) { 
      console.error('Row', r, e); 
    }
  }
}


function syncRow_(sheet, row) {
  const headers = readHeaders_(sheet);
  const rec = readRowObj_(sheet, row, headers);
  if (!rec) return;
  if (!hasAnyValue_(rec)) return;

  // 1. Handle College (must exist before student)
  // REQUIRED: college_name, college_degree, branch
  // OPTIONAL: city, state, country, nirf_ranking (will be null if missing)
  const collegePayload = pick_(rec, CFG.COLLEGE_FIELDS);
  enrichCollegeFromNIRF_(collegePayload);
  let collegeId = null;
  
  if (collegePayload.college_name && collegePayload.college_degree && collegePayload.branch) {
    collegeId = upsertCollegeGetId_(collegePayload);
    if (!collegeId) {
      console.error('Failed to upsert/fetch college for row', row);
      return;
    }
  } else {
    console.warn('Skipping row', row, '— missing required college fields (college_name, college_degree, branch)');
    return;
  }

  // 2. Handle Student
  // REQUIRED: email OR nxtwave_user_id (at least one)
  // OPTIONAL: phone_number, gender, resume_url, graduation_year, cgpa (will be null if missing)
  const studentPayload = pick_(rec, CFG.STUDENT_FIELDS);
  
  // Map phone_number to phone (database column name)
  if (studentPayload.phone_number) {
    studentPayload.phone = studentPayload.phone_number;
    delete studentPayload.phone_number;
  }
  
  // Use email or nxtwave_user_id to check for existing student
  if (!studentPayload.email && !studentPayload['Nxtwave User ID'] && !studentPayload.nxtwave_user_id) {
    console.warn('Skipping row', row, '— missing email or nxtwave_user_id for student upsert.');
    return;
  }

  // Parse numeric fields
  if ('graduation_year' in studentPayload) {
    studentPayload.graduation_year = toInt_(studentPayload.graduation_year);
  }
  if ('cgpa' in studentPayload) {
    studentPayload.cgpa = toFloat_(studentPayload.cgpa);
  }

  // Use nxtwave_user_id if provided, otherwise let Supabase auto-generate
  const nxtwaveUserId = studentPayload['Nxtwave User ID'] || studentPayload.nxtwave_user_id || null;
  if (nxtwaveUserId) {
    studentPayload.nxtwave_user_id = nxtwaveUserId;
  }
  delete studentPayload['Nxtwave User ID']; // Remove duplicate key

  // Add college_id
  if (collegeId) {
    studentPayload.college_id = collegeId;
  }

  const student = upsertStudentGetId_(studentPayload);
  if (!student || !student.nxtwave_user_id) {
    console.error('Failed to upsert/fetch student for row', row);
    return;
  }

  const studentId = student.nxtwave_user_id;

  // 3. Handle Assessment
  // OPTIONAL: All assessment fields are optional
  // If no assessment data exists, this section is skipped (no assessment record created)
  // Missing values will be null in database
  const assessmentBase = pick_(rec, CFG.ASSESSMENT_FIELDS);
  const assessmentScoresBase = pick_(rec, CFG.ASSESSMENT_SCORE_FIELDS);
  
  if (hasAnyValue_(assessmentBase) || hasAnyValue_(assessmentScoresBase)) {
    // Determine taken_at date
    const takenAt = assessmentBase.taken_at || assessmentBase.assessment_date || 
                    rec.interview_date || new Date().toISOString();
    
    const assessmentPayload = {
      student_id: studentId,
      taken_at: toISO_(takenAt),
      report_url: assessmentBase.report_url || null,
      total_student_score: toFloat_(assessmentBase.total_student_score),
      total_assessment_score: toFloat_(assessmentBase.total_assessment_score),
      percent: toFloat_(assessmentBase.percent)
    };

    const assessmentId = upsertAssessmentGetId_(assessmentPayload);
    
    if (assessmentId && hasAnyValue_(assessmentScoresBase)) {
      // 4. Handle Assessment Scores (normalized)
      upsertAssessmentScores_(assessmentId, assessmentScoresBase);
    }
  }

  // 5. Handle Interview
  // OPTIONAL: All interview fields are optional
  // REQUIRED for interview record: interview_date (if missing, no interview record created)
  // Missing rating values will be null in database
  const interviewBase = pick_(rec, CFG.INTERVIEW_FIELDS);
  if (hasAnyValue_(interviewBase) && interviewBase.interview_date) {
    const interviewPayload = {
      student_id: studentId,
      interview_date: toISO_(interviewBase.interview_date),
      recording_url: interviewBase.recording_url || interviewBase.recoding_url || null,
      // Old fields (kept for backward compatibility)
      self_intro_rating: toFloat_(interviewBase.self_intro_rating),
      problem_solving_rating: toFloat_(interviewBase.problem_solving_rating), // DEPRECATED
      communication_rating: toFloat_(interviewBase.communication_rating),
      conceptual_rating: toFloat_(interviewBase.conceptual_rating), // DEPRECATED
      overall_interview_rating: toFloat_(interviewBase.overall_interview_rating), // DEPRECATED
      // New fields
      problem1_solving_rating: toFloat_(interviewBase.problem1_solving_rating),
      problem1_solving_rating_code: interviewBase.problem1_solving_rating_code || null,
      problem2_solving_rating: toFloat_(interviewBase.problem2_solving_rating),
      problem2_solving_rating_code: interviewBase.problem2_solving_rating_code || null,
      DSA_Theory: toFloat_(interviewBase.DSA_Theory),
      Core_CS_Theory: toFloat_(interviewBase.Core_CS_Theory),
      overall_interview_score_out_of_100: toFloat_(interviewBase.overall_interview_score_out_of_100),
      // Common fields
      overall_label: normalizeOverallLabel_(interviewBase.overall_label),
      notes: interviewBase.interview_notes || interviewBase.notes || null
    };

    upsertInterview_(interviewPayload);
  }
}

/***** SUPABASE HELPERS - Updated for normalized schema *****/

function upsertCollegeGetId_(collegePayload) {
  const { baseUrl, key } = supaCreds_();
  
  // Check if college exists
  const checkUrl = `${baseUrl}/rest/v1/colleges?name=eq.${encodeURIComponent(collegePayload.college_name)}&degree=eq.${encodeURIComponent(collegePayload.college_degree)}&branch=eq.${encodeURIComponent(collegePayload.branch)}&select=college_id&limit=1`;
  
  const checkRes = UrlFetchApp.fetch(checkUrl, {
    method: 'get',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    },
    muteHttpExceptions: true
  });

  if (checkRes.getResponseCode() === 200) {
    const existing = safeJson_(checkRes.getContentText());
    if (existing && existing.length > 0) {
      return existing[0].college_id;
    }
  }

  // Insert new college
  const insertPayload = {
    name: collegePayload.college_name,
    degree: collegePayload.college_degree,
    branch: collegePayload.branch,
    city: collegePayload.college_city || collegePayload.city || null,
    state: collegePayload.college_state || collegePayload.state || null,
    country: collegePayload.college_country || collegePayload.country || 'India',
    nirf_ranking: toInt_(collegePayload.nirf_ranking)
  };

  const insertUrl = `${baseUrl}/rest/v1/colleges?select=college_id`;
  const insertRes = UrlFetchApp.fetch(insertUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify([insertPayload]),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=representation'
    },
    muteHttpExceptions: true
  });

  if (insertRes.getResponseCode() >= 200 && insertRes.getResponseCode() < 300) {
    const inserted = safeJson_(insertRes.getContentText());
    return inserted && inserted.length > 0 ? inserted[0].college_id : null;
  }

  console.error('College insert failed:', insertRes.getResponseCode(), insertRes.getContentText());
  return null;
}

function upsertStudentGetId_(studentPayload) {
  const { baseUrl, key } = supaCreds_();
  
  // Check if student exists by nxtwave_user_id or email
  let checkUrl;
  if (studentPayload.nxtwave_user_id) {
    checkUrl = `${baseUrl}/rest/v1/students?nxtwave_user_id=eq.${encodeURIComponent(studentPayload.nxtwave_user_id)}&select=nxtwave_user_id&limit=1`;
  } else if (studentPayload.email) {
    checkUrl = `${baseUrl}/rest/v1/students?email=eq.${encodeURIComponent(studentPayload.email)}&select=nxtwave_user_id&limit=1`;
  } else {
    return null;
  }

  const checkRes = UrlFetchApp.fetch(checkUrl, {
    method: 'get',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    },
    muteHttpExceptions: true
  });

  if (checkRes.getResponseCode() === 200) {
    const existing = safeJson_(checkRes.getContentText());
    if (existing && existing.length > 0) {
      // Update existing student
      const updateUrl = `${baseUrl}/rest/v1/students?nxtwave_user_id=eq.${encodeURIComponent(existing[0].nxtwave_user_id)}`;
      const updatePayload = Object.assign({}, studentPayload);
      delete updatePayload.nxtwave_user_id; // Don't update the ID
      
      UrlFetchApp.fetch(updateUrl, {
        method: 'patch',
        contentType: 'application/json',
        payload: JSON.stringify(updatePayload),
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        muteHttpExceptions: true
      });
      
      return existing[0];
    }
  }

  // Insert new student (let Supabase auto-generate nxtwave_user_id if not provided)
  const insertPayload = Object.assign({}, studentPayload);
  if (!insertPayload.nxtwave_user_id) {
    delete insertPayload.nxtwave_user_id; // Let Supabase auto-generate
  }

  const insertUrl = `${baseUrl}/rest/v1/students?select=nxtwave_user_id`;
  const insertRes = UrlFetchApp.fetch(insertUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify([insertPayload]),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=representation'
    },
    muteHttpExceptions: true
  });

  if (insertRes.getResponseCode() >= 200 && insertRes.getResponseCode() < 300) {
    const inserted = safeJson_(insertRes.getContentText());
    return inserted && inserted.length > 0 ? inserted[0] : null;
  }

  console.error('Student insert failed:', insertRes.getResponseCode(), insertRes.getContentText());
  return null;
}

function upsertAssessmentGetId_(assessmentPayload) {
  const { baseUrl, key } = supaCreds_();
  
  // Check if assessment exists
  const checkUrl = `${baseUrl}/rest/v1/assessments?student_id=eq.${encodeURIComponent(assessmentPayload.student_id)}&taken_at=eq.${encodeURIComponent(assessmentPayload.taken_at)}&select=assessment_id&limit=1`;
  
  const checkRes = UrlFetchApp.fetch(checkUrl, {
    method: 'get',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    },
    muteHttpExceptions: true
  });

  if (checkRes.getResponseCode() === 200) {
    const existing = safeJson_(checkRes.getContentText());
    if (existing && existing.length > 0) {
      // Update existing assessment
      const updateUrl = `${baseUrl}/rest/v1/assessments?assessment_id=eq.${encodeURIComponent(existing[0].assessment_id)}`;
      const updatePayload = Object.assign({}, assessmentPayload);
      delete updatePayload.student_id; // Don't update foreign key
      delete updatePayload.taken_at; // Don't update taken_at (part of unique check)
      
      UrlFetchApp.fetch(updateUrl, {
        method: 'patch',
        contentType: 'application/json',
        payload: JSON.stringify(updatePayload),
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        muteHttpExceptions: true
      });
      
      return existing[0].assessment_id;
    }
  }

  // Insert new assessment
  const insertUrl = `${baseUrl}/rest/v1/assessments?select=assessment_id`;
  const insertRes = UrlFetchApp.fetch(insertUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify([assessmentPayload]),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'return=representation'
    },
    muteHttpExceptions: true
  });

  if (insertRes.getResponseCode() >= 200 && insertRes.getResponseCode() < 300) {
    const inserted = safeJson_(insertRes.getContentText());
    return inserted && inserted.length > 0 ? inserted[0].assessment_id : null;
  }

  console.error('Assessment insert failed:', insertRes.getResponseCode(), insertRes.getContentText());
  return null;
}

function upsertAssessmentScores_(assessmentId, scoresBase) {
  const { baseUrl, key } = supaCreds_();
  
  // Get score type IDs (cache this if possible)
  const scoreTypesUrl = `${baseUrl}/rest/v1/score_types?select=score_type_id,key`;
  const scoreTypesRes = UrlFetchApp.fetch(scoreTypesUrl, {
    method: 'get',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    },
    muteHttpExceptions: true
  });

  if (scoreTypesRes.getResponseCode() !== 200) {
    console.error('Failed to fetch score types');
    return;
  }

  const scoreTypes = safeJson_(scoreTypesRes.getContentText());
  const scoreTypeMap = {};
  scoreTypes.forEach(st => {
    scoreTypeMap[st.key] = st.score_type_id;
  });

  // Map score fields to score type keys
  const scoreFieldMap = {
    'coding_score': 'coding',
    'dsa_score': 'dsa',
    'cs_fund_score': 'cs_fund',
    'quant_score': 'quant',
    'verbal_score': 'verbal',
    'logical_score': 'logical'
  };

  // Upsert each assessment score
  Object.keys(scoreFieldMap).forEach(scoreKey => {
    const maxKey = scoreKey.replace('_score', '_max');
    const scoreValue = toFloat_(scoresBase[scoreKey]);
    const maxValue = toFloat_(scoresBase[maxKey]);
    const scoreTypeKey = scoreFieldMap[scoreKey];
    const scoreTypeId = scoreTypeMap[scoreTypeKey];

    if (scoreValue !== null && maxValue !== null && scoreTypeId) {
      // Check if score exists
      const checkUrl = `${baseUrl}/rest/v1/assessment_scores?assessment_id=eq.${encodeURIComponent(assessmentId)}&score_type_id=eq.${encodeURIComponent(scoreTypeId)}&select=assessment_score_id&limit=1`;
      
      const checkRes = UrlFetchApp.fetch(checkUrl, {
        method: 'get',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        muteHttpExceptions: true
      });

      const scorePayload = {
        assessment_id: assessmentId,
        score_type_id: scoreTypeId,
        score: scoreValue,
        max_score: maxValue
      };

      if (checkRes.getResponseCode() === 200) {
        const existing = safeJson_(checkRes.getContentText());
        if (existing && existing.length > 0) {
          // Update existing score
          const updateUrl = `${baseUrl}/rest/v1/assessment_scores?assessment_score_id=eq.${encodeURIComponent(existing[0].assessment_score_id)}`;
          UrlFetchApp.fetch(updateUrl, {
            method: 'patch',
            contentType: 'application/json',
            payload: JSON.stringify({
              score: scoreValue,
              max_score: maxValue
            }),
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`
            },
            muteHttpExceptions: true
          });
        } else {
          // Insert new score
          const insertUrl = `${baseUrl}/rest/v1/assessment_scores`;
          UrlFetchApp.fetch(insertUrl, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify([scorePayload]),
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`
            },
            muteHttpExceptions: true
          });
        }
      }
    }
  });
}

function upsertInterview_(interviewPayload) {
  const { baseUrl, key } = supaCreds_();
  
  // Check if interview exists
  const checkUrl = `${baseUrl}/rest/v1/interviews?student_id=eq.${encodeURIComponent(interviewPayload.student_id)}&interview_date=eq.${encodeURIComponent(interviewPayload.interview_date)}&select=interview_id&limit=1`;
  
  const checkRes = UrlFetchApp.fetch(checkUrl, {
    method: 'get',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    },
    muteHttpExceptions: true
  });

  if (checkRes.getResponseCode() === 200) {
    const existing = safeJson_(checkRes.getContentText());
    if (existing && existing.length > 0) {
      // Update existing interview
      const updateUrl = `${baseUrl}/rest/v1/interviews?interview_id=eq.${encodeURIComponent(existing[0].interview_id)}`;
      const updatePayload = Object.assign({}, interviewPayload);
      delete updatePayload.student_id; // Don't update foreign key
      delete updatePayload.interview_date; // Don't update date (part of unique check)
      
      UrlFetchApp.fetch(updateUrl, {
        method: 'patch',
        contentType: 'application/json',
        payload: JSON.stringify(updatePayload),
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        },
        muteHttpExceptions: true
      });
      return;
    }
  }

  // Insert new interview
  const insertUrl = `${baseUrl}/rest/v1/interviews`;
  const insertRes = UrlFetchApp.fetch(insertUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify([interviewPayload]),
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`
    },
    muteHttpExceptions: true
  });

  if (insertRes.getResponseCode() < 200 || insertRes.getResponseCode() >= 300) {
    console.error('Interview insert failed:', insertRes.getResponseCode(), insertRes.getContentText());
  }
}

function supaCreds_() {
  const props = PropertiesService.getScriptProperties();
  const baseUrl = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_SERVICE_ROLE_KEY');
  if (!baseUrl || !key) {
    throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Script properties (File → Project Settings → Script Properties).');
  }
  return { baseUrl, key };
}

/***** SHEET READERS *****/
function readHeaders_(sheet) {
  const lastCol = sheet.getLastColumn();
  const vals = sheet.getRange(CFG.HEADER_ROW, 1, 1, lastCol).getValues()[0];
  return vals.map(h => String(h || '').trim());
}

function readRowObj_(sheet, row, headers) {
  const lastCol = sheet.getLastColumn();
  const vals = sheet.getRange(row, 1, 1, lastCol).getValues()[0];
  const obj = {};
  let hasAny = false;
  headers.forEach((h, i) => {
    if (!h) return;
    const v = vals[i];
    const val = (v instanceof Date) ? v : (v === '' ? null : v);
    obj[h] = val;
    if (val !== null && typeof val !== 'undefined' && val !== '') hasAny = true;
  });
  return hasAny ? obj : null;
}

/***** UTILS *****/
/**
 * Picks only the specified keys from object
 * If a key doesn't exist in obj, it won't be included in the output
 * This means missing columns in sheet = undefined/null values
 */
function pick_(obj, keys) {
  const out = {};
  keys.forEach(k => { if (k in obj) out[k] = obj[k]; });
  return out;
}

function enrichCollegeFromNIRF_(collegePayload) {
  if (!collegePayload || !collegePayload.college_name) return;

  const nirfData = getNIRFData_(collegePayload.college_name);
  if (!nirfData) return;

  let enriched = false;

  if (!collegePayload.college_city && !collegePayload.city && nirfData.city) {
    collegePayload.college_city = nirfData.city;
    collegePayload.city = nirfData.city;
    enriched = true;
  }

  if (!collegePayload.college_state && !collegePayload.state && nirfData.state) {
    collegePayload.college_state = nirfData.state;
    collegePayload.state = nirfData.state;
    enriched = true;
  }

  if (!collegePayload.nirf_ranking && nirfData.nirfRanking) {
    collegePayload.nirf_ranking = nirfData.nirfRanking;
    enriched = true;
  }

  if (enriched) {
    console.log('Enriched college metadata from NIRF for', collegePayload.college_name);
  }
}

function getNIRFData_(collegeName) {
  if (!collegeName) return null;
  const key = normalizeCollegeKey_(collegeName);
  return NIRF_DATA[key] || null;
}

function normalizeCollegeKey_(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9&()\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAnyValue_(obj) {
  return Object.keys(obj).some(k => obj[k] !== null && obj[k] !== '' && typeof obj[k] !== 'undefined');
}

function toISO_(v) {
  if (v instanceof Date) return v.toISOString();
  if (v === null || v === '' || typeof v === 'undefined') return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Converts value to float, returns null if empty/invalid
 * Missing sheet cells = null in database
 */
function toFloat_(v) {
  if (v === null || v === '' || typeof v === 'undefined') return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

/**
 * Converts value to integer, returns null if empty/invalid
 * Missing sheet cells = null in database
 */
function toInt_(v) {
  if (v === null || v === '' || typeof v === 'undefined') return null;
  const n = parseInt(v, 10);
  return isNaN(n) ? null : n;
}

function safeJson_(s) {
  try { return JSON.parse(s); } catch(e) { return null; }
}

function normalizeOverallLabel_(label) {
  if (!label) return null;
  const validLabels = ['Strong Hire', 'Medium Fit', 'Consider'];
  if (validLabels.includes(label)) return label;
  
  const normalized = String(label).trim().toLowerCase();
  if (normalized.includes('strong')) return 'Strong Hire';
  if (normalized.includes('medium')) return 'Medium Fit';
  if (normalized.includes('consider') || normalized.includes('low')) return 'Consider';
  return null;
}

// Adds a custom menu to manually sync data to Supabase
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Supabase Sync')
    .addItem('Sync Active Row', 'SyncActiveRowOnce')
    .addItem('Sync All Rows', 'SyncAll')
    .addToUi();
}

