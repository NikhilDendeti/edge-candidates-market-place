/**
 * Candidate service
 * Handles candidate list queries with filtering and sorting
 */
import { supabase } from '../config/supabase.js';
import { DatabaseError } from '../utils/errors.js';
import { transformToCandidate, transformToCompleteCandidateData, normalizeBranchName } from '../utils/transformers.js';
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
        if (error) {
            // Log the actual error for debugging
            console.error('Supabase query error:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                fullError: error,
            });
            // Wrap Supabase errors in DatabaseError for consistent error handling
            throw new DatabaseError('Failed to fetch candidates from database', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            });
        }
        // Transform data - use complete data transformer if requested
        let candidates = (data || []).map(filters.includeAllData ? transformToCompleteCandidateData : transformToCandidate);
        // Calculate verdict counts BEFORE applying verdict filter (but after search filter)
        const verdictCounts = {
            Strong: 0,
            Medium: 0,
            Low: 0,
        };
        candidates.forEach((candidate) => {
            // Handle both transformed and complete data formats
            const recommendation = candidate.recommendation ||
                (candidate.interviews?.[0]?.audit_final_status?.toUpperCase().includes('STRONG') ? 'Strong Hire' :
                    candidate.interviews?.[0]?.audit_final_status?.toUpperCase().includes('MEDIUM') ? 'Medium Fit' : 'Consider');
            if (recommendation === 'Strong Hire') {
                verdictCounts.Strong++;
            }
            else if (recommendation === 'Medium Fit') {
                verdictCounts.Medium++;
            }
            else if (recommendation === 'Consider') {
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
                // Extract numeric score from "XXX / YYY" format, handle "N/A" case
                const aScoreStr = a.assessmentScore === 'N/A' ? '0' : a.assessmentScore.split(' / ')[0];
                const bScoreStr = b.assessmentScore === 'N/A' ? '0' : b.assessmentScore.split(' / ')[0];
                const aScore = parseFloat(aScoreStr) || 0;
                const bScore = parseFloat(bScoreStr) || 0;
                return filters.order === 'asc' ? aScore - bScore : bScore - aScore;
            });
        }
        else if (filters.sort === 'interview_avg') {
            candidates.sort((a, b) => {
                // Extract numeric rating from "XX / 100" or "X.X / 10" format, handle "N/A" case
                const aRatingStr = a.interviewScore === 'N/A' ? '0' : a.interviewScore.split(' / ')[0];
                const bRatingStr = b.interviewScore === 'N/A' ? '0' : b.interviewScore.split(' / ')[0];
                const aRating = parseFloat(aRatingStr) || 0;
                const bRating = parseFloat(bRatingStr) || 0;
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
        // Let known API errors pass through
        if (error instanceof DatabaseError) {
            throw error;
        }
        // Handle different error types
        let errorMessage = 'Unknown error';
        let errorCode = 'UNKNOWN';
        const errorDetails = {};
        // Handle string errors
        if (typeof error === 'string') {
            errorMessage = error;
        }
        // Handle Error objects
        else if (error instanceof Error) {
            errorMessage = error.message || 'Unknown error';
            errorCode = error.code || 'UNKNOWN';
            if (error.stack) {
                errorDetails.stack = error.stack;
            }
        }
        // Handle Supabase/PostgREST errors
        else if (error && typeof error === 'object') {
            errorMessage = error.message || error.error_description || 'Unknown error';
            errorCode = error.code || 'UNKNOWN';
            if (error.details) {
                errorDetails.details = error.details;
            }
            if (error.hint) {
                errorDetails.hint = error.hint;
            }
            // Include the full error object for debugging
            errorDetails.originalError = {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            };
        }
        console.error('Error in getCandidates:', {
            filters,
            errorType: typeof error,
            errorMessage,
            errorCode,
            errorDetails,
            fullError: error,
            errorString: String(error),
        });
        // Pass comprehensive error details
        throw new DatabaseError('Failed to fetch candidates', {
            message: errorMessage,
            code: errorCode,
            ...errorDetails,
        });
    }
}
//# sourceMappingURL=candidateService.js.map