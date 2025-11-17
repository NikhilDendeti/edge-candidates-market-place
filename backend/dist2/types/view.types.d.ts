/**
 * View tracking types
 */
import { PaginationMeta } from './api.types.js';
/**
 * Request body for logging a candidate view
 */
export interface ViewLogRequest {
    email: string;
    name: string;
    company?: string;
    phone?: string;
}
/**
 * Response for logging a view
 */
export interface ViewLogResponse {
    message: string;
    viewId: string;
    userId: string;
    candidateId: string;
    viewedAt: string;
}
/**
 * User information
 */
export interface UserInfo {
    userId: string;
    email: string;
    name: string;
    company?: string;
    phone?: string;
}
/**
 * Candidate view entry
 */
export interface CandidateViewEntry {
    viewId: string;
    candidateId: string;
    candidateName: string;
    viewedAt: string;
    candidate?: {
        cgpa?: string;
        college?: string;
        branch?: string;
    };
}
/**
 * User view history response
 */
export interface UserViewHistory {
    user: UserInfo;
    data: CandidateViewEntry[];
    pagination: PaginationMeta;
}
/**
 * Viewer entry (user who viewed a candidate)
 */
export interface ViewerEntry {
    viewId: string;
    userId: string;
    user: UserInfo;
    viewedAt: string;
}
/**
 * Candidate viewers response
 */
export interface CandidateViewers {
    candidate: {
        candidateId: string;
        candidateName: string;
        totalViews: number;
        uniqueViewers: number;
    };
    data: ViewerEntry[];
    pagination: PaginationMeta;
}
/**
 * View statistics by date
 */
export interface ViewsByDate {
    date: string;
    count: number;
}
/**
 * User view statistics
 */
export interface UserViewStats {
    user: UserInfo;
    stats: {
        totalViews: number;
        uniqueCandidates: number;
        firstViewAt?: string;
        lastViewAt?: string;
        viewsByDate: ViewsByDate[];
    };
}
/**
 * View history filters
 */
export interface ViewHistoryFilters {
    page: number;
    limit: number;
    sort?: 'viewed_at' | 'candidate_name' | 'user_name';
    order?: 'asc' | 'desc';
}
//# sourceMappingURL=view.types.d.ts.map