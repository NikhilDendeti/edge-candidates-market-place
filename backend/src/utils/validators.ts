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

/**
 * Schema for view log request body
 */
export const viewLogRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required'),
  company: z.string().optional(),
  phone: z.string().optional(),
})

/**
 * Validate view log request body
 */
export function validateViewLogRequest(body: any) {
  try {
    return viewLogRequestSchema.parse(body)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(e => ({
        field: e.path.join('.'),
        issue: e.message,
      }))
      throw new ValidationError(
        `Invalid request body: ${error.errors.map(e => e.message).join(', ')}`,
        details
      )
    }
    throw error
  }
}

/**
 * Schema for email validation
 */
export const emailSchema = z.string().email('Invalid email format')

/**
 * Validate email format
 */
export function validateEmail(email: string) {
  try {
    return emailSchema.parse(email)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid email format', { field: 'email', issue: 'Invalid email format' })
    }
    throw error
  }
}

/**
 * Schema for view history filters
 */
export const viewHistoryFiltersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(['viewed_at', 'candidate_name', 'user_name']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * Validate view history filters
 */
export function validateViewHistoryFilters(query: any) {
  try {
    return viewHistoryFiltersSchema.parse(query)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`)
    }
    throw error
  }
}

/**
 * Schema for candidate ID (supports both UUID and VARCHAR)
 */
export const candidateIdSchema = z.string().min(1, 'Candidate ID is required')

/**
 * Validate candidate ID
 */
export function validateCandidateId(id: string) {
  try {
    return candidateIdSchema.parse(id)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Invalid candidate ID format')
    }
    throw error
  }
}

