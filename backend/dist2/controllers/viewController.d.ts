/**
 * View controller
 * Handles candidate view tracking requests
 */
import { Request, Response, NextFunction } from 'express';
/**
 * Log a candidate view
 * POST /api/candidates/:id/view
 */
export declare function logView(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Get user view history
 * GET /api/users/:email/candidates
 */
export declare function getUserViewHistoryHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Get candidate viewers
 * GET /api/candidates/:id/viewers
 */
export declare function getCandidateViewersHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
/**
 * Get user view statistics
 * GET /api/users/:email/stats
 */
export declare function getUserViewStatsHandler(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=viewController.d.ts.map