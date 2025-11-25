/**
 * Data transformation utilities
 * Transform database records to API response format
 */
import { Candidate } from '../types/candidate.types.js';
import { StudentProfile } from '../types/student.types.js';
interface StudentRecord {
    user_id: string;
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
        problem1_solving_rating?: number;
        problem1_solving_rating_code?: string;
        problem2_solving_rating?: number;
        problem2_solving_rating_code?: string;
        communication_rating?: number;
        conceptual_rating?: number;
        DSA_Theory?: number;
        Core_CS_Theory?: number;
        overall_interview_rating?: number;
        overall_interview_score_out_of_100?: number;
        audit_final_status?: string;
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
 * Transform student record to complete raw data (no anonymization)
 * Returns all database fields as-is
 */
export declare function transformToCompleteStudentData(student: StudentRecord): any;
/**
 * Transform candidate to complete raw data (no anonymization)
 */
export declare function transformToCompleteCandidateData(student: StudentRecord): any;
/**
 * Normalize branch name (same logic as frontend)
 */
export declare function normalizeBranchName(branch: string): string;
export {};
//# sourceMappingURL=transformers.d.ts.map