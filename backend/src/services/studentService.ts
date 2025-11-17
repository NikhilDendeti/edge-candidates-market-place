/**
 * Student service
 * Handles detailed student profile queries
 */

import { supabase } from '../config/supabase.js'
import { NotFoundError, DatabaseError } from '../utils/errors.js'
import { StudentProfile } from '../types/student.types.js'
import { transformToStudentProfile } from '../utils/transformers.js'

/**
 * Get student profile by ID
 */
export async function getStudentProfile(studentId: string): Promise<StudentProfile> {
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
      .eq('nxtwave_user_id', studentId)
      .single()

    if (error) {
      // Log the actual error for debugging
      console.error('Supabase query error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Student')
      }
      throw error
    }

    if (!students) {
      throw new NotFoundError('Student')
    }

    // Sort assessments and interviews by date (latest first)
    // This ensures the transformer gets the latest assessment/interview first
    if (students.assessments && Array.isArray(students.assessments)) {
      students.assessments.sort((a: any, b: any) => {
        const dateA = new Date(a.taken_at).getTime()
        const dateB = new Date(b.taken_at).getTime()
        return dateB - dateA // Descending order (latest first)
      })

      // Fetch assessment_scores separately if not loaded or empty
      // This handles cases where nested relations don't load properly
      for (const assessment of students.assessments) {
        if (!assessment.assessment_scores || assessment.assessment_scores.length === 0) {
          const { data: scores, error: scoresError } = await supabase
            .from('assessment_scores')
            .select(`
              *,
              score_types (*)
            `)
            .eq('assessment_id', assessment.assessment_id)

          if (!scoresError && scores) {
            assessment.assessment_scores = scores
          } else {
            assessment.assessment_scores = []
          }
        }
      }
    }

    if (students.interviews && Array.isArray(students.interviews)) {
      students.interviews.sort((a: any, b: any) => {
        const dateA = new Date(a.interview_date).getTime()
        const dateB = new Date(b.interview_date).getTime()
        return dateB - dateA // Descending order (latest first)
      })
    }

    // Transform to StudentProfile
    return transformToStudentProfile(students)
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error
    }
    // Include more error details in the DatabaseError
    const errorMessage = error?.message || 'Unknown error'
    const errorCode = error?.code || 'UNKNOWN'
    console.error('Error in getStudentProfile:', {
      studentId,
      errorMessage,
      errorCode,
      error,
    })
    throw new DatabaseError('Failed to fetch student profile', { originalError: error, message: errorMessage, code: errorCode })
  }
}

