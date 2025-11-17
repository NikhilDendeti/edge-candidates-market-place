/**
 * View service
 * Handles candidate view tracking and queries
 */
import { ViewLogRequest, ViewLogResponse, UserViewHistory, CandidateViewers, UserViewStats, ViewHistoryFilters } from '../types/view.types.js';
/**
 * Log a candidate view
 */
export declare function logCandidateView(candidateId: string, userData: ViewLogRequest): Promise<ViewLogResponse>;
/**
 * Get user view history
 */
export declare function getUserViewHistory(email: string, filters: ViewHistoryFilters): Promise<UserViewHistory>;
/**
 * Get candidate viewers
 */
export declare function getCandidateViewers(candidateId: string, filters: ViewHistoryFilters): Promise<CandidateViewers>;
/**
 * Get user view statistics
 */
export declare function getUserViewStats(email: string): Promise<UserViewStats>;
//# sourceMappingURL=viewService.d.ts.map