/**
 * Student profile types
 */

export interface StudentProfile {
  id: string
  name: string
  initials: string
  meta: string
  cgpa: string
  skills: string[]
  gender?: string
  phone?: string
  email?: string
  resumeUrl?: []
  college: {
    name: string
    branch: string
    nirfRanking?: number
    city?: string
    state?: string
  }
  assessmentOverall: {
    percentage: number
    raw: string
  }
  interviewOverall: {
    percentage: number
    raw: string
  }
  latestAssessment?: {
    assessmentId: string
    takenAt: string
    reportUrl?: []
    totalStudentScore: number
    totalAssessmentScore: number
    percent: number
    scores: AssessmentScore[]
  }
  latestInterview?: {
    interviewId: string
    interviewDate: string
    recordingUrl?: []
    scores: InterviewScore[]
    overallRating: number
    overallLabel: 'Strong Hire' | 'Medium Fit' | 'Consider'
    notes?: string
  }
  allAssessments: Array<{
    assessmentId: string
    takenAt: string
    percent: number
    reportUrl?: []
  }>
  allInterviews: Array<{
    interviewId: string
    interviewDate: string
    overallLabel: string
    recordingUrl?: []
  }>
}

export interface AssessmentScore {
  type: string
  label: string
  score: number
  maxScore: number
  percentage: number
  rating: string
}

export interface InterviewScore {
  criteria: string
  score: number
  max: number
  rating: string
}

