/**
 * Student service
 * Handles detailed student profile queries
 */
import { StudentProfile } from '../types/student.types.js';
/**
 * Get student profile by ID
 * @param studentId - Student user_id
 * @param includeAllData - If true, returns all database fields without anonymization
 */
export declare function getStudentProfile(studentId: string, includeAllData?: boolean): Promise<StudentProfile | any>;
//# sourceMappingURL=studentService.d.ts.map