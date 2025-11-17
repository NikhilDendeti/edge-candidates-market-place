/**
 * Statistics service
 * Handles aggregation queries for dashboard statistics
 */
import { BranchDistribution, VerdictSummary } from '../types/candidate.types.js';
export interface StatsSummary {
    totalCandidates: number;
    branchDistribution: BranchDistribution[];
    verdictSummary: VerdictSummary[];
}
/**
 * Get complete statistics summary
 */
export declare function getStatsSummary(): Promise<StatsSummary>;
/**
 * Get branch distribution
 */
export declare function getBranchDistribution(): Promise<BranchDistribution[]>;
/**
 * Get verdict summary
 */
export declare function getVerdictSummary(): Promise<VerdictSummary[]>;
//# sourceMappingURL=statsService.d.ts.map