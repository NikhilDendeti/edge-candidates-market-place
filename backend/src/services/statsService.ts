/**
 * Statistics service
 * Handles aggregation queries for dashboard statistics
 */

import { supabase } from '../config/supabase.js'
import { DatabaseError } from '../utils/errors.js'
import { BranchDistribution, VerdictSummary } from '../types/candidate.types.js'
import { normalizeBranchName } from '../utils/transformers.js'

export interface StatsSummary {
  totalCandidates: number
  branchDistribution: BranchDistribution[]
  verdictSummary: VerdictSummary[]
}

/**
 * Get complete statistics summary
 */
export async function getStatsSummary(): Promise<StatsSummary> {
  try {
    // Get total candidates count
    const { count: totalCandidates, error: countError } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Supabase count error:', {
        code: countError.code,
        message: countError.message,
        details: countError.details,
        hint: countError.hint,
        fullError: countError,
      })
      throw new DatabaseError('Failed to fetch candidate count', {
        message: countError.message,
        code: countError.code,
        details: countError.details,
        hint: countError.hint,
      })
    }

    // Get branch distribution
    const branchDistribution = await getBranchDistribution()

    // Get verdict summary
    const verdictSummary = await getVerdictSummary()

    return {
      totalCandidates: totalCandidates || 0,
      branchDistribution,
      verdictSummary,
    }
  } catch (error: any) {
    // Let known API errors pass through
    if (error instanceof DatabaseError) {
      throw error
    }
    
    // Handle different error types
    let errorMessage = 'Unknown error'
    let errorCode = 'UNKNOWN'
    const errorDetails: any = {}
    
    if (typeof error === 'string') {
      errorMessage = error
    } else if (error instanceof Error) {
      errorMessage = error.message || 'Unknown error'
      errorCode = (error as any).code || 'UNKNOWN'
      if (error.stack) {
        errorDetails.stack = error.stack
      }
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || error.error_description || 'Unknown error'
      errorCode = error.code || 'UNKNOWN'
      if (error.details) errorDetails.details = error.details
      if (error.hint) errorDetails.hint = error.hint
      errorDetails.originalError = {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      }
    }
    
    console.error('Error in getStatsSummary:', {
      errorType: typeof error,
      errorMessage,
      errorCode,
      errorDetails,
      fullError: error,
    })
    
    throw new DatabaseError('Failed to fetch statistics', {
      message: errorMessage,
      code: errorCode,
      ...errorDetails,
    })
  }
}

/**
 * Get branch distribution
 */
export async function getBranchDistribution(): Promise<BranchDistribution[]> {
  try {
    // Fetch students with colleges
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        college_id,
        colleges (
          branch
        )
      `)

    if (error) {
      console.error('Supabase query error (branch distribution):', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error,
      })
      throw new DatabaseError('Failed to fetch branch distribution from database', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
    }

    // Count branches
    const branchCounts: Record<string, number> = {}
    students?.forEach((student: any) => {
      const collegeRecord = Array.isArray(student.colleges)
        ? student.colleges[0]
        : student.colleges
      const branch = collegeRecord?.branch
      if (branch) {
        const normalized = normalizeBranchName(branch)
        branchCounts[normalized] = (branchCounts[normalized] || 0) + 1
      }
    })

    // Convert to array and sort
    const branchEntries = Object.entries(branchCounts)
      .map(([label, count]) => ({
        label,
        count,
        percent: 0, // Will calculate after sorting
      }))
      .sort((a, b) => b.count - a.count)

    const total = students?.length || 1

    // Take top 3 and group rest as "Other"
    const topBranches = branchEntries.slice(0, 3).map((branch, index) => ({
      label: branch.label,
      count: branch.count,
      percent: Math.round((branch.count / total) * 100),
      tone: index === 0 ? 'primary-900' : index === 1 ? 'primary-400' : 'primary-200',
    }))

    const otherCount = branchEntries.slice(3).reduce((sum, branch) => sum + branch.count, 0)
    const distribution: BranchDistribution[] = [...topBranches]

    if (otherCount > 0) {
      distribution.push({
        label: 'Other',
        count: otherCount,
        percent: Math.round((otherCount / total) * 100),
        tone: 'neutral-100',
      })
    }

    return distribution
  } catch (error: any) {
    if (error instanceof DatabaseError) {
      throw error
    }
    
    let errorMessage = 'Unknown error'
    let errorCode = 'UNKNOWN'
    const errorDetails: any = {}
    
    if (typeof error === 'string') {
      errorMessage = error
    } else if (error instanceof Error) {
      errorMessage = error.message || 'Unknown error'
      errorCode = (error as any).code || 'UNKNOWN'
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || 'Unknown error'
      errorCode = error.code || 'UNKNOWN'
      if (error.details) errorDetails.details = error.details
      if (error.hint) errorDetails.hint = error.hint
    }
    
    console.error('Error in getBranchDistribution:', {
      errorType: typeof error,
      errorMessage,
      errorCode,
      fullError: error,
    })
    
    throw new DatabaseError('Failed to fetch branch distribution', {
      message: errorMessage,
      code: errorCode,
      ...errorDetails,
    })
  }
}

/**
 * Get verdict summary
 */
export async function getVerdictSummary(): Promise<VerdictSummary[]> {
  try {
    // Fetch interviews with overall_label
    const { data: interviews, error } = await supabase
      .from('interviews')
      .select('overall_label')

    if (error) {
      console.error('Supabase query error (branch distribution):', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        fullError: error,
      })
      throw new DatabaseError('Failed to fetch branch distribution from database', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      })
    }

    // Count by verdict
    const verdictCounts: Record<string, number> = {
      Strong: 0,
      Medium: 0,
      Low: 0,
    }

    interviews?.forEach((interview) => {
      if (interview.overall_label === 'Strong Hire') {
        verdictCounts.Strong++
      } else if (interview.overall_label === 'Medium Fit') {
        verdictCounts.Medium++
      } else if (interview.overall_label === 'Consider') {
        verdictCounts.Low++
      }
    })

    return [
      { label: 'Strong', count: verdictCounts.Strong },
      { label: 'Medium', count: verdictCounts.Medium },
      { label: 'Low', count: verdictCounts.Low },
    ]
  } catch (error: any) {
    if (error instanceof DatabaseError) {
      throw error
    }
    
    let errorMessage = 'Unknown error'
    let errorCode = 'UNKNOWN'
    const errorDetails: any = {}
    
    if (typeof error === 'string') {
      errorMessage = error
    } else if (error instanceof Error) {
      errorMessage = error.message || 'Unknown error'
      errorCode = (error as any).code || 'UNKNOWN'
    } else if (error && typeof error === 'object') {
      errorMessage = error.message || 'Unknown error'
      errorCode = error.code || 'UNKNOWN'
      if (error.details) errorDetails.details = error.details
      if (error.hint) errorDetails.hint = error.hint
    }
    
    console.error('Error in getVerdictSummary:', {
      errorType: typeof error,
      errorMessage,
      errorCode,
      fullError: error,
    })
    
    throw new DatabaseError('Failed to fetch verdict summary', {
      message: errorMessage,
      code: errorCode,
      ...errorDetails,
    })
  }
}

