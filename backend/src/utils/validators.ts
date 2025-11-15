/**
 * Request validation using Zod
 */

import { z } from 'zod'
import { ValidationError } from './errors.js'

export const candidateFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  verdict: z.enum(['Strong', 'Medium', 'Low', 'All']).optional(),
  sort: z.enum(['assessment_avg', 'interview_avg', 'cgpa', 'latest']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export function validateCandidateFilters(query: any) {
  try {
    return candidateFiltersSchema.parse(query)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

export const studentIdSchema = z.string().uuid()

export function validateStudentId(id: string) {
  try {
    return studentIdSchema.parse(id)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid student ID format')
    }
    throw error
  }
}

