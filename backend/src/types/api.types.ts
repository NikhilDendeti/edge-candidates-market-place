/**
 * API request and response types
 */

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface ApiResponse<T> {
  data: T
  pagination?: PaginationMeta
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: any
  }
}

