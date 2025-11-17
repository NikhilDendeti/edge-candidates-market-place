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

    if (countError) throw countError

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
    throw new DatabaseError('Failed to fetch statistics', error)
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

    if (error) throw error

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
    throw new DatabaseError('Failed to fetch branch distribution', error)
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

    if (error) throw error

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
    throw new DatabaseError('Failed to fetch verdict summary', error)
  }
}

