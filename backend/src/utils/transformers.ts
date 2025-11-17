/**
 * Data transformation utilities
 * Transform database records to API response format
 */

import { Candidate, CandidateRecommendation } from '../types/candidate.types.js'
import { StudentProfile, AssessmentScore, InterviewScore } from '../types/student.types.js'

// Database types (matching Supabase schema)
interface StudentRecord {
  nxtwave_user_id: string
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
    problem_solving_rating?: number
    communication_rating?: number
    conceptual_rating?: number
    overall_interview_rating?: number
    overall_label?: 'Strong Hire' | 'Medium Fit' | 'Consider'
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
  
  if (communicationRating && communicationRating >= 8) {
    skills.push('Strong Communication')
  }

  return skills
}

/**
 * Transform student record to Candidate type
 */
export function transformToCandidate(student: StudentRecord): Candidate {
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
  if (latestInterview && latestInterview.overall_interview_rating !== null && latestInterview.overall_interview_rating !== undefined) {
    interviewScore = `${latestInterview.overall_interview_rating} / 10`
    interviewMeta = latestInterview.recording_url ? 'Recorded' : 'Not recorded'
  }

  // Derive recommendation from interview or default
  const recommendation: CandidateRecommendation = latestInterview?.overall_label || 'Consider'

  return {
    id: student.nxtwave_user_id,
    name: student.full_name,
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
    resumeUrl: student.resume_url || undefined,
  }
}

/**
 * Transform student record to StudentProfile type
 */
export function transformToStudentProfile(student: StudentRecord): StudentProfile {
  const latestAssessment = student.assessments?.[0]
  const latestInterview = student.interviews?.[0]

  // Calculate initials
  const initials = student.full_name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
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
  const interviewOverall = latestInterview && latestInterview.overall_interview_rating !== null && latestInterview.overall_interview_rating !== undefined
    ? {
        percentage: Math.round(latestInterview.overall_interview_rating * 10),
        raw: `${latestInterview.overall_interview_rating} / 10`,
      }
    : { percentage: 0, raw: '0 / 10' }

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
    if (latestInterview.self_intro_rating !== null && latestInterview.self_intro_rating !== undefined) {
      interviewScores.push({
        criteria: 'Self Introduction',
        score: latestInterview.self_intro_rating,
        max: 5,
        rating: calculateRating(latestInterview.self_intro_rating, 5),
      })
    }
    if (latestInterview.problem_solving_rating !== null && latestInterview.problem_solving_rating !== undefined) {
      interviewScores.push({
        criteria: 'Problem Solving & Coding',
        score: latestInterview.problem_solving_rating,
        max: 35,
        rating: calculateRating(latestInterview.problem_solving_rating, 35),
      })
    }
    if (latestInterview.communication_rating !== null && latestInterview.communication_rating !== undefined) {
      interviewScores.push({
        criteria: 'Communication Skills',
        score: latestInterview.communication_rating,
        max: 9,
        rating: calculateRating(latestInterview.communication_rating, 9),
      })
    }
    if (latestInterview.conceptual_rating !== null && latestInterview.conceptual_rating !== undefined) {
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
    reportUrl: a.report_url,
  })) || []

  // All interviews
  const allInterviews = student.interviews?.map((i) => ({
    interviewId: i.interview_id,
    interviewDate: i.interview_date,
    overallLabel: i.overall_label || 'Consider',
    recordingUrl: i.recording_url,
  })) || []

  return {
    id: student.nxtwave_user_id,
    name: student.full_name,
    initials,
    meta,
    cgpa,
    skills: deriveSkillsWithCommunication(
      latestAssessment?.assessment_scores,
      latestInterview?.communication_rating
    ),
    phone: student.phone,
    email: student.email,
    resumeUrl: student.resume_url,
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
      reportUrl: latestAssessment.report_url,
      totalStudentScore: latestAssessment.total_student_score || 0,
      totalAssessmentScore: latestAssessment.total_assessment_score || 0,
      percent: latestAssessment.percent || 0,
      scores: assessmentScores,
    } : undefined,
    latestInterview: latestInterview ? {
      interviewId: latestInterview.interview_id,
      interviewDate: latestInterview.interview_date,
      recordingUrl: latestInterview.recording_url,
      scores: interviewScores,
      overallRating: latestInterview.overall_interview_rating || 0,
      overallLabel: latestInterview.overall_label || 'Consider',
      notes: latestInterview.notes,
    } : undefined,
    allAssessments,
    allInterviews,
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

