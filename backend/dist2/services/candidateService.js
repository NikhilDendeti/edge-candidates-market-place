/**
 * Candidate service
 * Handles candidate list queries with filtering and sorting
 */
import { supabase } from '../config/supabase.js';
import { DatabaseError } from '../utils/errors.js';
import { transformToCandidate, normalizeBranchName } from '../utils/transformers.js';
/**
 * Get candidates list with filters and pagination
 */
export async function getCandidates(filters) {
    try {
        // Build base query - fetch all students with relations
        // Note: For assessment/interview sorting, we need all data first
        let query = supabase
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
      `, { count: 'exact' });
        // Apply search filter
        if (filters.search) {
            const searchTerm = `%${filters.search}%`;
            query = query.or(`full_name.ilike.${searchTerm},colleges.name.ilike.${searchTerm},colleges.branch.ilike.${searchTerm}`);
        }
        // For simple sorts, apply at database level
        if (filters.sort === 'cgpa') {
            query = query.order('cgpa', { ascending: filters.order === 'asc' });
        }
        else if (filters.sort === 'latest') {
            query = query.order('created_at', { ascending: filters.order === 'asc' });
        }
        else {
            // Default sort by created_at
            query = query.order('created_at', { ascending: filters.order === 'asc' });
        }
        // Execute query - fetch all matching records
        const { data, error } = await query;
        if (error)
            throw error;
        // Transform data
        let candidates = (data || []).map(transformToCandidate);
        // Calculate verdict counts BEFORE applying verdict filter (but after search filter)
        const verdictCounts = {
            Strong: 0,
            Medium: 0,
            Low: 0,
        };
        candidates.forEach((candidate) => {
            if (candidate.recommendation === 'Strong Hire') {
                verdictCounts.Strong++;
            }
            else if (candidate.recommendation === 'Medium Fit') {
                verdictCounts.Medium++;
            }
            else if (candidate.recommendation === 'Consider') {
                verdictCounts.Low++;
            }
        });
        // Calculate branch mix BEFORE applying verdict filter (but after search filter)
        const branchCounts = {};
        candidates.forEach((candidate) => {
            if (candidate.branch) {
                const normalized = normalizeBranchName(candidate.branch);
                branchCounts[normalized] = (branchCounts[normalized] || 0) + 1;
            }
        });
        // Convert to array and calculate percentages
        const totalCandidates = candidates.length || 1;
        const branchMix = Object.entries(branchCounts)
            .map(([label, count]) => ({
            label,
            count,
            percent: Math.round((count / totalCandidates) * 100),
        }))
            .sort((a, b) => b.count - a.count); // Sort by count descending
        // Apply assessment/interview sorting if needed (post-query)
        if (filters.sort === 'assessment_avg') {
            candidates.sort((a, b) => {
                // Extract numeric score from "XXX / YYY" format
                const aScore = parseFloat(a.assessmentScore.split(' / ')[0]) || 0;
                const bScore = parseFloat(b.assessmentScore.split(' / ')[0]) || 0;
                return filters.order === 'asc' ? aScore - bScore : bScore - aScore;
            });
        }
        else if (filters.sort === 'interview_avg') {
            candidates.sort((a, b) => {
                // Extract numeric rating from "X.X / 10" format
                const aRating = parseFloat(a.interviewScore.split(' / ')[0]) || 0;
                const bRating = parseFloat(b.interviewScore.split(' / ')[0]) || 0;
                return filters.order === 'asc' ? aRating - bRating : bRating - aRating;
            });
        }
        // Apply verdict filter (post-query since it's from interviews)
        if (filters.verdict && filters.verdict !== 'All') {
            const verdictMap = {
                Strong: 'Strong Hire',
                Medium: 'Medium Fit',
                Low: 'Consider',
            };
            candidates = candidates.filter((c) => c.recommendation === verdictMap[filters.verdict]);
        }
        // Calculate total after filtering
        const totalAfterFilter = candidates.length;
        const totalPages = Math.ceil(totalAfterFilter / filters.limit);
        // Apply pagination to filtered and sorted results
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit;
        const paginatedCandidates = candidates.slice(from, to);
        return {
            data: paginatedCandidates,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total: totalAfterFilter,
                totalPages,
            },
            verdictCounts,
            branchMix,
        };
    }
    catch (error) {
        throw new DatabaseError('Failed to fetch candidates', error);
    }
}
//# sourceMappingURL=candidateService.js.map