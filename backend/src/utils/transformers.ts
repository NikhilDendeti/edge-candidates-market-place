/**
 * Data transformation utilities
 * Transform database records to API response format
 */

import { Candidate, CandidateRecommendation } from '../types/candidate.types.js'
import { StudentProfile, AssessmentScore, InterviewScore } from '../types/student.types.js'
import { getCandidateAlias, maskEmail, maskPhone, redactToEmptyArray } from './anonymizer.js'

// Database types (matching Supabase schema)
interface StudentRecord {
  user_id: string
  full_name: string
  phone?: string
  email?: string
  gender?: string
  resume_url?: string
  graduation_year?: number
  cgpa?: number
  created_at: string
  colleges?: {
    name: string
    branch: string
    nirf_ranking?: number
    city?: string
    state?: string
  }
  assessments?: Array<{
    assessment_id: string
    taken_at: string
    report_url?: string
    total_student_score?: number
    total_assessment_score?: number
    percent?: number
    assessment_scores?: Array<{
      score: number
      max_score: number
      score_types?: {
        key: string
        display_name: string
      }
    }>
  }>
  interviews?: Array<{
    interview_id: string
    interview_date: string
    recording_url?: string
    self_intro_rating?: number
    problem_solving_rating?: number // DEPRECATED: Use problem1_solving_rating and problem2_solving_rating
    problem1_solving_rating?: number
    problem1_solving_rating_code?: string
    problem2_solving_rating?: number
    problem2_solving_rating_code?: string
    communication_rating?: number
    conceptual_rating?: number // DEPRECATED: Use DSA_Theory and Core_CS_Theory
    DSA_Theory?: number
    Core_CS_Theory?: number
    overall_interview_rating?: number // DEPRECATED: Use overall_interview_score_out_of_100
    overall_interview_score_out_of_100?: number
    audit_final_status?: string
    notes?: string
  }>
}

/**
 * Format date to "DD MMM" format
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${date.getDate()} ${months[date.getMonth()]}`
}

/**
 * Calculate rating based on score percentage
 */
function calculateRating(score: number, max: number): string {
  const percentage = (score / max) * 100
  if (percentage >= 80) return 'Excellent'
  if (percentage >= 60) return 'Good'
  if (percentage >= 40) return 'Fair'
  return 'Poor'
}

/**
 * Derive skills from assessment scores
 */
function deriveSkills(assessmentScores?: Array<{ score: number; max_score: number; score_types?: { key: string } }>): string[] {
  if (!assessmentScores || assessmentScores.length === 0) return []

  const skills: string[] = []
  const threshold = 0.7 // 70%

  assessmentScores.forEach((as) => {
    if (!as.score_types) return
    const percentage = as.score / as.max_score

    if (as.score_types.key === 'coding' && percentage > threshold) {
      skills.push('Strong Problem Solving')
    }
    if (as.score_types.key === 'dsa' && percentage > threshold) {
      skills.push('Strong DSA')
    }
    if (as.score_types.key === 'cs_fund' && percentage > threshold) {
      skills.push('Strong Theory')
    }
  })

  return skills
}

/**
 * Derive skills including communication from interview
 */
function deriveSkillsWithCommunication(
  assessmentScores?: Array<{ score: number; max_score: number; score_types?: { key: string } }>,
  communicationRating?: number
): string[] {
  const skills = deriveSkills(assessmentScores)
  
  // Communication rating is now out of 5, so threshold is 4 (80% of 5)
  if (communicationRating && communicationRating >= 4) {
    skills.push('Strong Communication')
  }

  return skills
}

/**
 * Transform student record to Candidate type
 */
export function transformToCandidate(student: StudentRecord): Candidate {
  const alias = getCandidateAlias(student.user_id)
  const latestAssessment = student.assessments?.[0]
  const latestInterview = student.interviews?.[0]

  // Format assessment score
  let assessmentScore = 'N/A'
  let assessmentMeta = 'No assessment'
  if (latestAssessment && latestAssessment.total_student_score && latestAssessment.total_assessment_score) {
    assessmentScore = `${latestAssessment.total_student_score} / ${latestAssessment.total_assessment_score}`
    assessmentMeta = `Last taken: ${formatDate(latestAssessment.taken_at)}`
  }

  // Format interview score
  let interviewScore = 'N/A'
  let interviewMeta = 'Not recorded'
  if (latestInterview) {
    // Use new overall_interview_score_out_of_100 if available, fallback to old field
    if (latestInterview.overall_interview_score_out_of_100 !== null && latestInterview.overall_interview_score_out_of_100 !== undefined) {
      interviewScore = `${latestInterview.overall_interview_score_out_of_100} / 100`
    } else if (latestInterview.overall_interview_rating !== null && latestInterview.overall_interview_rating !== undefined) {
      interviewScore = `${latestInterview.overall_interview_rating} / 10`
    }
    interviewMeta = latestInterview.recording_url ? 'Recorded' : 'Not recorded'
  }

  // Derive recommendation from interview audit_final_status or default
  // Map audit_final_status (e.g., "STRONG HIRE", "MEDIUM HIRE") to recommendation format
  let recommendation: CandidateRecommendation = 'Consider'
  if (latestInterview?.audit_final_status) {
    const status = latestInterview.audit_final_status.toUpperCase()
    if (status.includes('STRONG')) {
      recommendation = 'Strong Hire'
    } else if (status.includes('MEDIUM')) {
      recommendation = 'Medium Fit'
    }
  }

  return {
    id: student.user_id,
    name: alias,
    college: student.colleges?.name || '',
    branch: student.colleges?.branch || '',
    cgpa: student.cgpa?.toFixed(2) || '0.00',
    assessmentScore,
    assessmentMeta,
    interviewScore,
    interviewMeta,
    skills: deriveSkillsWithCommunication(
      latestAssessment?.assessment_scores,
      latestInterview?.communication_rating
    ),
    recommendation,
    resumeUrl: redactToEmptyArray(),
  }
}

/**
 * Transform student record to StudentProfile type
 */
export function transformToStudentProfile(student: StudentRecord): StudentProfile {
  const alias = getCandidateAlias(student.user_id)
  const latestAssessment = student.assessments?.[0]
  const latestInterview = student.interviews?.[0]
  const maskedEmail = student.email ? maskEmail(student.email) : undefined
  const maskedPhone = student.phone ? maskPhone(student.phone) : undefined

  // Calculate initials
  const initials = alias
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 2)
    .padEnd(2, 'X')
    .toUpperCase()

  // Build meta string
  const nirfText = student.colleges?.nirf_ranking ? ` (NIRF: ${student.colleges.nirf_ranking})` : ''
  const graduationText = student.graduation_year ? `Class of ${student.graduation_year}` : ''
  const meta = `${student.colleges?.name || ''}${nirfText} • ${student.colleges?.branch || ''} • ${graduationText}`.trim()

  // Format CGPA
  const cgpa = student.cgpa ? `${student.cgpa.toFixed(2)} / 10.0` : '0.00 / 10.0'

  // Assessment overall
  const assessmentOverall = latestAssessment && latestAssessment.percent
    ? {
        percentage: Math.round(latestAssessment.percent),
        raw: `${latestAssessment.total_student_score || 0} / ${latestAssessment.total_assessment_score || 0}`,
      }
    : { percentage: 0, raw: '0 / 0' }

  // Interview overall
  let interviewOverall = { percentage: 0, raw: '0 / 100' }
  if (latestInterview) {
    // Use new overall_interview_score_out_of_100 if available, fallback to old field
    if (latestInterview.overall_interview_score_out_of_100 !== null && latestInterview.overall_interview_score_out_of_100 !== undefined) {
      interviewOverall = {
        percentage: Math.round(latestInterview.overall_interview_score_out_of_100),
        raw: `${latestInterview.overall_interview_score_out_of_100} / 100`,
      }
    } else if (latestInterview.overall_interview_rating !== null && latestInterview.overall_interview_rating !== undefined) {
      interviewOverall = {
        percentage: Math.round(latestInterview.overall_interview_rating * 10),
        raw: `${latestInterview.overall_interview_rating} / 10`,
      }
    }
  }

  // Transform assessment scores
  const assessmentScores: AssessmentScore[] = []
  if (latestAssessment?.assessment_scores && Array.isArray(latestAssessment.assessment_scores)) {
    latestAssessment.assessment_scores.forEach((as: any) => {
      // Only include if score_types relation exists
      if (as.score_types) {
        const percentage = (as.score / as.max_score) * 100
        assessmentScores.push({
          type: as.score_types.key || '',
          label: as.score_types.display_name || '',
          score: as.score,
          maxScore: as.max_score,
          percentage: Math.round(percentage),
          rating: calculateRating(as.score, as.max_score),
        })
      }
    })
  }

  // Transform interview scores
  // Include scores even if they are 0 (but exclude if null/undefined)
  const interviewScores: InterviewScore[] = []
  if (latestInterview) {
    // Self Introduction (out of 5)
    if (latestInterview.self_intro_rating !== null && latestInterview.self_intro_rating !== undefined) {
      interviewScores.push({
        criteria: 'Self Introduction',
        score: latestInterview.self_intro_rating,
        max: 5,
        rating: calculateRating(latestInterview.self_intro_rating, 5),
      })
    }
    
    // Problem 1 Solving (out of 5) - NEW
    if (latestInterview.problem1_solving_rating !== null && latestInterview.problem1_solving_rating !== undefined) {
      interviewScores.push({
        criteria: 'Problem 1 Solving',
        score: latestInterview.problem1_solving_rating,
        max: 5,
        rating: calculateRating(latestInterview.problem1_solving_rating, 5),
      })
    }
    
    // Problem 2 Solving (out of 5) - NEW
    if (latestInterview.problem2_solving_rating !== null && latestInterview.problem2_solving_rating !== undefined) {
      interviewScores.push({
        criteria: 'Problem 2 Solving',
        score: latestInterview.problem2_solving_rating,
        max: 5,
        rating: calculateRating(latestInterview.problem2_solving_rating, 5),
      })
    }
    
    // Fallback to old problem_solving_rating if new fields not available
    if (interviewScores.filter(s => s.criteria.includes('Problem')).length === 0 &&
        latestInterview.problem_solving_rating !== null && latestInterview.problem_solving_rating !== undefined) {
      interviewScores.push({
        criteria: 'Problem Solving & Coding',
        score: latestInterview.problem_solving_rating,
        max: 35,
        rating: calculateRating(latestInterview.problem_solving_rating, 35),
      })
    }
    
    // Communication Skills (out of 5) - Updated from 9 to 5
    if (latestInterview.communication_rating !== null && latestInterview.communication_rating !== undefined) {
      interviewScores.push({
        criteria: 'Communication Skills',
        score: latestInterview.communication_rating,
        max: 5,
        rating: calculateRating(latestInterview.communication_rating, 5),
      })
    }
    
    // DSA Theory (out of 5) - NEW
    if (latestInterview.DSA_Theory !== null && latestInterview.DSA_Theory !== undefined) {
      interviewScores.push({
        criteria: 'DSA Theory',
        score: latestInterview.DSA_Theory,
        max: 5,
        rating: calculateRating(latestInterview.DSA_Theory, 5),
      })
    }
    
    // Core CS Theory (out of 5) - NEW
    if (latestInterview.Core_CS_Theory !== null && latestInterview.Core_CS_Theory !== undefined) {
      interviewScores.push({
        criteria: 'Core CS Theory',
        score: latestInterview.Core_CS_Theory,
        max: 5,
        rating: calculateRating(latestInterview.Core_CS_Theory, 5),
      })
    }
    
    // Fallback to old conceptual_rating if new fields not available
    if (interviewScores.filter(s => s.criteria.includes('Theory') || s.criteria.includes('Conceptual')).length === 0 &&
        latestInterview.conceptual_rating !== null && latestInterview.conceptual_rating !== undefined) {
      interviewScores.push({
        criteria: 'Conceptual & Theoretical',
        score: latestInterview.conceptual_rating,
        max: 6,
        rating: calculateRating(latestInterview.conceptual_rating, 6),
      })
    }
  }

  // All assessments
  const allAssessments = student.assessments?.map((a) => ({
    assessmentId: a.assessment_id,
    takenAt: a.taken_at,
    percent: a.percent || 0,
    reportUrl: redactToEmptyArray(),
  })) || []

  // Helper function to map audit_final_status to overallLabel
  const mapAuditStatusToLabel = (status: string | null | undefined): 'Strong Hire' | 'Medium Fit' | 'Consider' => {
    if (!status) return 'Consider'
    const normalized = status.toUpperCase().trim()
    if (normalized.includes('STRONG')) return 'Strong Hire'
    if (normalized.includes('MEDIUM')) return 'Medium Fit'
    return 'Consider'
  }

  // All interviews
  const allInterviews = student.interviews?.map((i) => ({
    interviewId: i.interview_id,
    interviewDate: i.interview_date,
    overallLabel: mapAuditStatusToLabel(i.audit_final_status),
    recordingUrl: redactToEmptyArray(),
  })) || []

  return {
    id: student.user_id,
    name: alias,
    initials,
    meta,
    cgpa,
    skills: deriveSkillsWithCommunication(
      latestAssessment?.assessment_scores,
      latestInterview?.communication_rating
    ),
    gender: student.gender,
    phone: maskedPhone,
    email: maskedEmail,
    resumeUrl: redactToEmptyArray(),
    college: {
      name: student.colleges?.name || '',
      branch: student.colleges?.branch || '',
      nirfRanking: student.colleges?.nirf_ranking,
      city: student.colleges?.city,
      state: student.colleges?.state,
    },
    assessmentOverall,
    interviewOverall,
    latestAssessment: latestAssessment ? {
      assessmentId: latestAssessment.assessment_id,
      takenAt: latestAssessment.taken_at,
      reportUrl: redactToEmptyArray(),
      totalStudentScore: latestAssessment.total_student_score || 0,
      totalAssessmentScore: latestAssessment.total_assessment_score || 0,
      percent: latestAssessment.percent || 0,
      scores: assessmentScores,
    } : undefined,
    latestInterview: latestInterview ? {
      interviewId: latestInterview.interview_id,
      interviewDate: latestInterview.interview_date,
      recordingUrl: redactToEmptyArray(),
      scores: interviewScores,
      overallRating: latestInterview.overall_interview_score_out_of_100 !== null && latestInterview.overall_interview_score_out_of_100 !== undefined
        ? latestInterview.overall_interview_score_out_of_100
        : (latestInterview.overall_interview_rating || 0),
      overallLabel: mapAuditStatusToLabel(latestInterview.audit_final_status),
      notes: latestInterview.notes,
      problem1_solving_rating: latestInterview.problem1_solving_rating,
      problem1_solving_rating_code: latestInterview.problem1_solving_rating_code,
      problem2_solving_rating: latestInterview.problem2_solving_rating,
      problem2_solving_rating_code: latestInterview.problem2_solving_rating_code,
      DSA_Theory: latestInterview.DSA_Theory,
      Core_CS_Theory: latestInterview.Core_CS_Theory,
      overall_interview_score_out_of_100: latestInterview.overall_interview_score_out_of_100,
    } : undefined,
    allAssessments,
    allInterviews,
  }
}

/**
 * Transform student record to complete raw data (no anonymization)
 * Returns all database fields as-is
 */
export function transformToCompleteStudentData(student: StudentRecord): any {
  return {
    // Student fields
    user_id: student.user_id,
    full_name: student.full_name,
    phone: student.phone,
    email: student.email,
    gender: student.gender,
    resume_url: student.resume_url,
    graduation_year: student.graduation_year,
    cgpa: student.cgpa,
    college_id: (student as any).college_id,
    created_at: student.created_at,
    updated_at: (student as any).updated_at,
    
    // College data
    college: student.colleges ? {
      college_id: (student.colleges as any).college_id,
      name: student.colleges.name,
      branch: student.colleges.branch,
      degree: (student.colleges as any).degree,
      nirf_ranking: student.colleges.nirf_ranking,
      city: student.colleges.city,
      state: student.colleges.state,
      created_at: (student.colleges as any).created_at,
      updated_at: (student.colleges as any).updated_at,
    } : null,
    
    // All assessments with complete data
    assessments: student.assessments?.map((assessment: any) => ({
      assessment_id: assessment.assessment_id,
      student_id: assessment.student_id,
      taken_at: assessment.taken_at,
      report_url: assessment.report_url,
      org_assess_id: assessment.org_assess_id,
      total_student_score: assessment.total_student_score,
      total_assessment_score: assessment.total_assessment_score,
      percent: assessment.percent,
      attempt_end_reason: assessment.attempt_end_reason,
      proctor_details: assessment.proctor_details,
      created_at: assessment.created_at,
      updated_at: assessment.updated_at,
      assessment_scores: assessment.assessment_scores?.map((score: any) => ({
        assessment_score_id: score.assessment_score_id,
        assessment_id: score.assessment_id,
        score_type_id: score.score_type_id,
        score: score.score,
        max_score: score.max_score,
        time_spent: score.time_spent,
        duration: score.duration,
        created_at: score.created_at,
        score_type: score.score_types ? {
          score_type_id: score.score_types.score_type_id,
          key: score.score_types.key,
          display_name: score.score_types.display_name,
          description: score.score_types.description,
          created_at: score.score_types.created_at,
        } : null,
      })) || [],
    })) || [],
    
    // All interviews with complete data
    interviews: student.interviews?.map((interview: any) => ({
      interview_id: interview.interview_id,
      student_id: interview.student_id,
      interview_date: interview.interview_date,
      recording_url: interview.recording_url,
      communication_rating: interview.communication_rating,
      core_cs_theory_rating: interview.core_cs_theory_rating,
      dsa_theory_rating: interview.dsa_theory_rating,
      problem1_solving_rating: interview.problem1_solving_rating,
      problem1_code_implementation_rating: interview.problem1_code_implementation_rating,
      problem1_solving_rating_code: interview.problem1_solving_rating_code,
      problem2_solving_rating: interview.problem2_solving_rating,
      problem2_code_implementation_rating: interview.problem2_code_implementation_rating,
      problem2_solving_rating_code: interview.problem2_solving_rating_code,
      overall_interview_score_out_of_100: interview.overall_interview_score_out_of_100,
      notes: interview.notes,
      audit_final_status: interview.audit_final_status,
      created_at: interview.created_at,
      // Include deprecated fields for completeness
      self_intro_rating: interview.self_intro_rating,
      problem_solving_rating: interview.problem_solving_rating,
      conceptual_rating: interview.conceptual_rating,
      overall_interview_rating: interview.overall_interview_rating,
      DSA_Theory: interview.DSA_Theory,
      Core_CS_Theory: interview.Core_CS_Theory,
    })) || [],
  }
}

/**
 * Transform candidate to complete raw data (no anonymization)
 */
export function transformToCompleteCandidateData(student: StudentRecord): any {
  const latestInterview = student.interviews?.[0]
  
  // Map audit_final_status to recommendation
  let recommendation = 'Consider'
  if (latestInterview?.audit_final_status) {
    const status = latestInterview.audit_final_status.toUpperCase()
    if (status.includes('STRONG')) {
      recommendation = 'Strong Hire'
    } else if (status.includes('MEDIUM')) {
      recommendation = 'Medium Fit'
    }
  }
  
  return {
    id: student.user_id,
    user_id: student.user_id,
    full_name: student.full_name,
    name: student.full_name, // Keep alias for backward compatibility
    phone: student.phone,
    email: student.email,
    gender: student.gender,
    resume_url: student.resume_url,
    graduation_year: student.graduation_year,
    cgpa: student.cgpa,
    college_id: (student as any).college_id,
    created_at: student.created_at,
    updated_at: (student as any).updated_at,
    college: student.colleges?.name || '',
    branch: student.colleges?.branch || '',
    recommendation,
    // Include all assessment and interview data with complete nested structures
    assessments: student.assessments?.map((assessment: any) => ({
      assessment_id: assessment.assessment_id,
      student_id: assessment.student_id,
      taken_at: assessment.taken_at,
      report_url: assessment.report_url,
      org_assess_id: assessment.org_assess_id,
      total_student_score: assessment.total_student_score,
      total_assessment_score: assessment.total_assessment_score,
      percent: assessment.percent,
      attempt_end_reason: assessment.attempt_end_reason,
      proctor_details: assessment.proctor_details,
      created_at: assessment.created_at,
      updated_at: assessment.updated_at,
      assessment_scores: assessment.assessment_scores?.map((score: any) => ({
        assessment_score_id: score.assessment_score_id,
        assessment_id: score.assessment_id,
        score_type_id: score.score_type_id,
        score: score.score,
        max_score: score.max_score,
        time_spent: score.time_spent,
        duration: score.duration,
        created_at: score.created_at,
        score_types: score.score_types ? {
          score_type_id: score.score_types.score_type_id,
          key: score.score_types.key,
          display_name: score.score_types.display_name,
          description: score.score_types.description,
          created_at: score.score_types.created_at,
        } : null,
        // Also include as score_type for consistency
        score_type: score.score_types ? {
          score_type_id: score.score_types.score_type_id,
          key: score.score_types.key,
          display_name: score.score_types.display_name,
          description: score.score_types.description,
          created_at: score.score_types.created_at,
        } : null,
      })) || [],
    })) || [],
    interviews: student.interviews?.map((interview: any) => ({
      interview_id: interview.interview_id,
      student_id: interview.student_id,
      interview_date: interview.interview_date,
      recording_url: interview.recording_url,
      communication_rating: interview.communication_rating,
      core_cs_theory_rating: interview.core_cs_theory_rating,
      dsa_theory_rating: interview.dsa_theory_rating,
      problem1_solving_rating: interview.problem1_solving_rating,
      problem1_code_implementation_rating: interview.problem1_code_implementation_rating,
      problem1_solving_rating_code: interview.problem1_solving_rating_code,
      problem2_solving_rating: interview.problem2_solving_rating,
      problem2_code_implementation_rating: interview.problem2_code_implementation_rating,
      problem2_solving_rating_code: interview.problem2_solving_rating_code,
      overall_interview_score_out_of_100: interview.overall_interview_score_out_of_100,
      notes: interview.notes,
      audit_final_status: interview.audit_final_status,
      created_at: interview.created_at,
      // Include deprecated fields for completeness
      self_intro_rating: interview.self_intro_rating,
      problem_solving_rating: interview.problem_solving_rating,
      conceptual_rating: interview.conceptual_rating,
      overall_interview_rating: interview.overall_interview_rating,
      DSA_Theory: interview.DSA_Theory,
      Core_CS_Theory: interview.Core_CS_Theory,
    })) || [],
    colleges: student.colleges ? {
      college_id: (student.colleges as any).college_id,
      name: student.colleges.name,
      branch: student.colleges.branch,
      degree: (student.colleges as any).degree,
      nirf_ranking: student.colleges.nirf_ranking,
      city: student.colleges.city,
      state: student.colleges.state,
      created_at: (student.colleges as any).created_at,
      updated_at: (student.colleges as any).updated_at,
    } : null,
  }
}

/**
 * Normalize branch name (same logic as frontend)
 */
export function normalizeBranchName(branch: string): string {
  const normalized = branch.trim().toLowerCase()

  if (normalized.includes('computer science') || normalized.includes('cse') || normalized.includes('cs')) {
    return 'CSE'
  }
  if (normalized.includes('information technology') || normalized.includes('it')) {
    return 'IT'
  }
  if (normalized.includes('electronics') || normalized.includes('ece') || normalized.includes('e&c')) {
    return 'ECE'
  }
  if (normalized.includes('electrical') || normalized.includes('eee')) {
    return 'EEE'
  }
  if (normalized.includes('mechanical') || normalized.includes('me')) {
    return 'ME'
  }

  return branch.length <= 5 ? branch.toUpperCase() : branch.substring(0, 10)
}

