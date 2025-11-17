/**
 * Error handling middleware
 * Handles all HTTP status codes properly
 */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors.js';
export declare function errorHandler(err: Error | ApiError, req: Request, res: Response, _next: NextFunction): void;
//# sourceMappingURL=errorHandler.d.ts.map