/**
 * Request validation using Zod
 */
import { z } from 'zod';
import { ValidationError } from './errors.js';
export const candidateFiltersSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().optional(),
    verdict: z.enum(['Strong', 'Medium', 'Low', 'All']).optional(),
    sort: z.enum(['assessment_avg', 'interview_avg', 'cgpa', 'latest']).optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
    includeAllData: z.coerce.boolean().optional(),
    complete: z.coerce.boolean().optional(), // Alias for includeAllData
});
export function validateCandidateFilters(query) {
    try {
        const parsed = candidateFiltersSchema.parse(query);
        // Handle alias: if 'complete' is true, set includeAllData to true
        if (parsed.complete) {
            parsed.includeAllData = true;
        }
        return parsed;
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError(`Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
}
export const studentIdSchema = z.string().uuid();
export function validateStudentId(id) {
    try {
        return studentIdSchema.parse(id);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Invalid student ID format');
        }
        throw error;
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
});
/**
 * Validate view log request body
 */
export function validateViewLogRequest(body) {
    try {
        return viewLogRequestSchema.parse(body);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const details = error.errors.map(e => ({
                field: e.path.join('.'),
                issue: e.message,
            }));
            throw new ValidationError(`Invalid request body: ${error.errors.map(e => e.message).join(', ')}`, details);
        }
        throw error;
    }
}
/**
 * Schema for email validation
 */
export const emailSchema = z.string().email('Invalid email format');
/**
 * Validate email format
 */
export function validateEmail(email) {
    try {
        return emailSchema.parse(email);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Invalid email format', { field: 'email', issue: 'Invalid email format' });
        }
        throw error;
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
});
/**
 * Validate view history filters
 */
export function validateViewHistoryFilters(query) {
    try {
        return viewHistoryFiltersSchema.parse(query);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError(`Invalid query parameters: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
}
/**
 * Schema for candidate ID (supports both UUID and VARCHAR)
 */
export const candidateIdSchema = z.string().min(1, 'Candidate ID is required');
/**
 * Validate candidate ID
 */
export function validateCandidateId(id) {
    try {
        return candidateIdSchema.parse(id);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new ValidationError('Invalid candidate ID format');
        }
        throw error;
    }
}
//# sourceMappingURL=validators.js.map