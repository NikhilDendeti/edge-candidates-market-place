/**
 * Custom error classes
 * Comprehensive HTTP status code handling
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// 400 Bad Request - Client error (validation, malformed request)
export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details)
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string = 'Bad request', details?: any) {
    super(400, message, 'BAD_REQUEST', details)
  }
}

// 401 Unauthorized - Authentication required
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(401, message, 'UNAUTHORIZED')
  }
}

// 403 Forbidden - Authenticated but not authorized
export class ForbiddenError extends ApiError {
  constructor(message: string = 'Access forbidden') {
    super(403, message, 'FORBIDDEN')
  }
}

// 404 Not Found - Resource not found
export class NotFoundError extends ApiError {
  constructor(resource: string = 'Resource') {
    super(404, `${resource} not found`, 'NOT_FOUND')
  }
}

// 409 Conflict - Resource conflict (e.g., duplicate)
export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(409, message, 'CONFLICT', details)
  }
}

// 422 Unprocessable Entity - Validation failed (semantic validation)
export class UnprocessableEntityError extends ApiError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(422, message, 'UNPROCESSABLE_ENTITY', details)
  }
}

// 429 Too Many Requests - Rate limiting
export class TooManyRequestsError extends ApiError {
  constructor(message: string = 'Too many requests', retryAfter?: number) {
    super(429, message, 'TOO_MANY_REQUESTS', { retryAfter })
  }
}

// 500 Internal Server Error - Server errors
export class DatabaseError extends ApiError {
  constructor(message: string = 'Database error', originalError?: any) {
    super(500, message, 'DATABASE_ERROR', originalError)
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, message, 'INTERNAL_ERROR', details)
  }
}

// 503 Service Unavailable - Service temporarily unavailable
export class ServiceUnavailableError extends ApiError {
  constructor(message: string = 'Service temporarily unavailable', retryAfter?: number) {
    super(503, message, 'SERVICE_UNAVAILABLE', { retryAfter })
  }
}

