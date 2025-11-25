/**
 * Candidate-related types
 */

export type CandidateRecommendation = 'Strong Hire' | 'Medium Fit' | 'Consider'

export interface Candidate {
  id: string
  name: string
  college: string
  branch: string
  cgpa: string
  assessmentScore: string
  assessmentMeta: string
  interviewScore: string
  interviewMeta: string
  skills: string[]
  recommendation: CandidateRecommendation
  resumeUrl?: []
}

export interface CandidateFilters {
  page: number
  limit: number
  search?: string
  verdict?: 'Strong' | 'Medium' | 'Low' | 'All'
  sort?: 'assessment_avg' | 'interview_avg' | 'cgpa' | 'latest'
  order?: 'asc' | 'desc'
  includeAllData?: boolean
}

export interface BranchDistribution {
  label: string
  percent: number
  count: number
  tone: string
}

export interface VerdictSummary {
  label: 'Strong' | 'Medium' | 'Low'
  count: number
}

