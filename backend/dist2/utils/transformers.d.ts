/**
 * Data transformation utilities
 * Transform database records to API response format
 */
import { Candidate } from '../types/candidate.types.js';
import { StudentProfile } from '../types/student.types.js';
interface StudentRecord {
    nxtwave_user_id: string;
    full_name: string;
    phone?: string;
    email?: string;
    gender?: string;
    resume_url?: string;
    graduation_year?: number;
    cgpa?: number;
    created_at: string;
    colleges?: {
        name: string;
        branch: string;
        nirf_ranking?: number;
        city?: string;
        state?: string;
    };
    assessments?: Array<{
        assessment_id: string;
        taken_at: string;
        report_url?: string;
        total_student_score?: number;
        total_assessment_score?: number;
        percent?: number;
        assessment_scores?: Array<{
            score: number;
            max_score: number;
            score_types?: {
                key: string;
                display_name: string;
            };
        }>;
    }>;
    interviews?: Array<{
        interview_id: string;
        interview_date: string;
        recording_url?: string;
        self_intro_rating?: number;
        problem_solving_rating?: number;
        communication_rating?: number;
        conceptual_rating?: number;
        overall_interview_rating?: number;
        overall_label?: 'Strong Hire' | 'Medium Fit' | 'Consider';
        notes?: string;
    }>;
}
/**
 * Transform student record to Candidate type
 */
export declare function transformToCandidate(student: StudentRecord): Candidate;
/**
 * Transform student record to StudentProfile type
 */
export declare function transformToStudentProfile(student: StudentRecord): StudentProfile;
/**
 * Normalize branch name (same logic as frontend)
 */
export declare function normalizeBranchName(branch: string): string;
export {};
//# sourceMappingURL=transformers.d.ts.map