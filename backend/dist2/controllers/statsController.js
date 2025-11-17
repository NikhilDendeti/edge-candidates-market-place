/**
 * Statistics controller
 */
import { getStatsSummary, getBranchDistribution } from '../services/statsService.js';
export async function getSummary(_req, res, next) {
    try {
        const summary = await getStatsSummary();
        // Explicitly set 200 status code
        res.status(200).json(summary);
        return;
    }
    catch (error) {
        next(error);
    }
}
export async function getBranchDistributionHandler(_req, res, next) {
    try {
        const distribution = await getBranchDistribution();
        // Explicitly set 200 status code
        res.status(200).json(distribution);
        return;
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=statsController.js.map