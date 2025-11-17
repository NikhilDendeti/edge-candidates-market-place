/**
 * Candidates controller
 */
import { getCandidates } from '../services/candidateService.js';
import { validateCandidateFilters } from '../utils/validators.js';
export async function listCandidates(req, res, next) {
    try {
        const filters = validateCandidateFilters(req.query);
        const result = await getCandidates(filters);
        // Explicitly set 200 status code
        res.status(200).json(result);
        return;
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=candidatesController.js.map