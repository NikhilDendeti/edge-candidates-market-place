/**
 * Students controller
 */
import { getStudentProfile } from '../services/studentService.js';
import { validateStudentId } from '../utils/validators.js';
export async function getStudent(req, res, next) {
    try {
        const studentId = validateStudentId(req.params.id);
        // Check if client wants complete data (all fields without anonymization)
        const includeAllData = req.query.includeAllData === 'true' || req.query.complete === 'true';
        const profile = await getStudentProfile(studentId, includeAllData);
        // Explicitly set 200 status code
        res.status(200).json(profile);
        return;
    }
    catch (error) {
        next(error);
    }
}
//# sourceMappingURL=studentsController.js.map