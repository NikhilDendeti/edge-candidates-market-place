/**
 * Error handling middleware
 * Handles all HTTP status codes properly
 */

import { Request, Response, NextFunction } from 'express'
import { ApiError, InternalServerError } from '../utils/errors.js'

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error with context
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] Error:`, {
    message: err.message,
    code: err instanceof ApiError ? err.code : 'UNKNOWN',
    statusCode: err instanceof ApiError ? err.statusCode : 500,
    path: req.path,
    method: req.method,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })

  // Handle known API errors
  if (err instanceof ApiError) {
    const errorResponse: any = {
      error: {
        code: err.code || 'INTERNAL_ERROR',
        message: err.message,
        timestamp,
      },
    }

    // Add details if available
    if (err.details) {
      errorResponse.error.details = err.details
    }

    // Add stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = err.stack
    }

    // Add retry-after header for 429 and 503
    if (err.statusCode === 429 || err.statusCode === 503) {
      const retryAfter = err.details?.retryAfter || 60
      res.setHeader('Retry-After', retryAfter.toString())
    }

    res.status(err.statusCode).json(errorResponse)
    return
  }

  // Handle unknown errors - convert to InternalServerError
  const internalError = new InternalServerError(
    'An unexpected error occurred',
    process.env.NODE_ENV === 'development' ? err.message : undefined
  )

  const errorResponse: any = {
    error: {
      code: 'INTERNAL_ERROR',
      message: internalError.message,
      timestamp,
    },
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.details = err.message
    errorResponse.error.stack = err.stack
  }

  res.status(500).json(errorResponse)
  return
}

