/**
 * Statistics routes
 */
import { Router } from 'express';
import { getSummary, getBranchDistributionHandler } from '../controllers/statsController.js';
const router = Router();
router.get('/summary', getSummary);
router.get('/branch-distribution', getBranchDistributionHandler);
export default router;
//# sourceMappingURL=stats.js.map