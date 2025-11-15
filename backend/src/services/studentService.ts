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
      .order('assessments.taken_at', { ascending: false, foreignTable: 'assessments' })
      .order('interviews.interview_date', { ascending: false, foreignTable: 'interviews' })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundError('Student')
      }
      throw error
    }

    if (!students) {
      throw new NotFoundError('Student')
    }

    // Transform to StudentProfile
    return transformToStudentProfile(students)
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      throw error
    }
    throw new DatabaseError('Failed to fetch student profile', error)
  }
}

