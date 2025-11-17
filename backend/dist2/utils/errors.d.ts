/**
 * Custom error classes
 * Comprehensive HTTP status code handling
 */
export declare class ApiError extends Error {
    statusCode: number;
    message: string;
    code?: string | undefined;
    details?: any | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined, details?: any | undefined);
}
export declare class ValidationError extends ApiError {
    constructor(message: string, details?: any);
}
export declare class BadRequestError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class UnauthorizedError extends ApiError {
    constructor(message?: string);
}
export declare class ForbiddenError extends ApiError {
    constructor(message?: string);
}
export declare class NotFoundError extends ApiError {
    constructor(resource?: string);
}
export declare class ConflictError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class UnprocessableEntityError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class TooManyRequestsError extends ApiError {
    constructor(message?: string, retryAfter?: number);
}
export declare class DatabaseError extends ApiError {
    constructor(message?: string, originalError?: any);
}
export declare class InternalServerError extends ApiError {
    constructor(message?: string, details?: any);
}
export declare class ServiceUnavailableError extends ApiError {
    constructor(message?: string, retryAfter?: number);
}
//# sourceMappingURL=errors.d.ts.map