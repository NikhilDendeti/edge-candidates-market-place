/**
 * Student service
 * Handles detailed student profile queries
 */
import { supabase } from '../config/supabase.js';
import { NotFoundError, DatabaseError } from '../utils/errors.js';
import { transformToStudentProfile, transformToCompleteStudentData } from '../utils/transformers.js';
/**
 * Get student profile by ID
 * @param studentId - Student user_id
 * @param includeAllData - If true, returns all database fields without anonymization
 */
export async function getStudentProfile(studentId, includeAllData = false) {
    try {
        // Fetch student with all related data
        // Note: Ordering on foreign tables must be done after fetching, not in the query
        const { data: students, error } = await supabase
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
      `)
            .eq('user_id', studentId)
            .single();
        if (error) {
            // Log the actual error for debugging
            console.error('Supabase query error:', {
                studentId,
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint,
                fullError: error,
            });
            if (error.code === 'PGRST116') {
                throw new NotFoundError('Student');
            }
            // Wrap Supabase errors in DatabaseError for consistent error handling
            throw new DatabaseError('Failed to fetch student from database', {
                message: error.message,
                code: error.code,
                details: error.details,
                hint: error.hint,
            });
        }
        if (!students) {
            throw new NotFoundError('Student');
        }
        // Sort assessments and interviews by date (latest first)
        // This ensures the transformer gets the latest assessment/interview first
        if (students.assessments && Array.isArray(students.assessments)) {
            students.assessments.sort((a, b) => {
                const dateA = new Date(a.taken_at).getTime();
                const dateB = new Date(b.taken_at).getTime();
                return dateB - dateA; // Descending order (latest first)
            });
            // Fetch assessment_scores separately if not loaded or empty
            // This handles cases where nested relations don't load properly
            for (const assessment of students.assessments) {
                if (!assessment.assessment_scores || assessment.assessment_scores.length === 0) {
                    try {
                        const { data: scores, error: scoresError } = await supabase
                            .from('assessment_scores')
                            .select(`
                *,
                score_types (*)
              `)
                            .eq('assessment_id', assessment.assessment_id);
                        if (scoresError) {
                            console.warn('Failed to fetch assessment_scores:', {
                                assessment_id: assessment.assessment_id,
                                error: scoresError,
                            });
                            assessment.assessment_scores = [];
                        }
                        else if (scores) {
                            assessment.assessment_scores = scores;
                        }
                        else {
                            assessment.assessment_scores = [];
                        }
                    }
                    catch (nestedError) {
                        console.error('Error fetching assessment_scores:', {
                            assessment_id: assessment.assessment_id,
                            error: nestedError,
                        });
                        assessment.assessment_scores = [];
                    }
                }
            }
        }
        if (students.interviews && Array.isArray(students.interviews)) {
            students.interviews.sort((a, b) => {
                const dateA = new Date(a.interview_date).getTime();
                const dateB = new Date(b.interview_date).getTime();
                return dateB - dateA; // Descending order (latest first)
            });
        }
        // Return complete data if requested, otherwise transform to StudentProfile
        if (includeAllData) {
            return transformToCompleteStudentData(students);
        }
        // Transform to StudentProfile
        return transformToStudentProfile(students);
    }
    catch (error) {
        // Let known API errors pass through
        if (error instanceof NotFoundError || error instanceof DatabaseError) {
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
        console.error('Error in getStudentProfile:', {
            studentId,
            errorType: typeof error,
            errorMessage,
            errorCode,
            errorDetails,
            fullError: error,
            errorString: String(error),
        });
        // Pass comprehensive error details
        throw new DatabaseError('Failed to fetch student profile', {
            message: errorMessage,
            code: errorCode,
            ...errorDetails,
        });
    }
}
//# sourceMappingURL=studentService.js.map