/**
 * Candidate service
 * Handles candidate list queries with filtering and sorting
 */
import { Candidate, CandidateFilters } from '../types/candidate.types.js';
import { PaginationMeta } from '../types/api.types.js';
export interface CandidateListResult {
    data: Candidate[];
    pagination: PaginationMeta;
    verdictCounts: {
        Strong: number;
        Medium: number;
        Low: number;
    };
}
/**
 * Get candidates list with filters and pagination
 */
export declare function getCandidates(filters: CandidateFilters): Promise<CandidateListResult>;
//# sourceMappingURL=candidateService.d.ts.map