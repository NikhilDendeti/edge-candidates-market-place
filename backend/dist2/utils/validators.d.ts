/**
 * Request validation using Zod
 */
import { z } from 'zod';
export declare const candidateFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    search: z.ZodOptional<z.ZodString>;
    verdict: z.ZodOptional<z.ZodEnum<["Strong", "Medium", "Low", "All"]>>;
    sort: z.ZodOptional<z.ZodEnum<["assessment_avg", "interview_avg", "cgpa", "latest"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    order: "asc" | "desc";
    sort?: "assessment_avg" | "interview_avg" | "cgpa" | "latest" | undefined;
    search?: string | undefined;
    verdict?: "Strong" | "Medium" | "Low" | "All" | undefined;
}, {
    sort?: "assessment_avg" | "interview_avg" | "cgpa" | "latest" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    search?: string | undefined;
    verdict?: "Strong" | "Medium" | "Low" | "All" | undefined;
    order?: "asc" | "desc" | undefined;
}>;
export declare function validateCandidateFilters(query: any): {
    page: number;
    limit: number;
    order: "asc" | "desc";
    sort?: "assessment_avg" | "interview_avg" | "cgpa" | "latest" | undefined;
    search?: string | undefined;
    verdict?: "Strong" | "Medium" | "Low" | "All" | undefined;
};
export declare const studentIdSchema: z.ZodString;
export declare function validateStudentId(id: string): string;
/**
 * Schema for view log request body
 */
export declare const viewLogRequestSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodString;
    company: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    company?: string | undefined;
    phone?: string | undefined;
}, {
    name: string;
    email: string;
    company?: string | undefined;
    phone?: string | undefined;
}>;
/**
 * Validate view log request body
 */
export declare function validateViewLogRequest(body: any): {
    name: string;
    email: string;
    company?: string | undefined;
    phone?: string | undefined;
};
/**
 * Schema for email validation
 */
export declare const emailSchema: z.ZodString;
/**
 * Validate email format
 */
export declare function validateEmail(email: string): string;
/**
 * Schema for view history filters
 */
export declare const viewHistoryFiltersSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort: z.ZodOptional<z.ZodEnum<["viewed_at", "candidate_name", "user_name"]>>;
    order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    order: "asc" | "desc";
    sort?: "viewed_at" | "candidate_name" | "user_name" | undefined;
}, {
    sort?: "viewed_at" | "candidate_name" | "user_name" | undefined;
    page?: number | undefined;
    limit?: number | undefined;
    order?: "asc" | "desc" | undefined;
}>;
/**
 * Validate view history filters
 */
export declare function validateViewHistoryFilters(query: any): {
    page: number;
    limit: number;
    order: "asc" | "desc";
    sort?: "viewed_at" | "candidate_name" | "user_name" | undefined;
};
/**
 * Schema for candidate ID (supports both UUID and VARCHAR)
 */
export declare const candidateIdSchema: z.ZodString;
/**
 * Validate candidate ID
 */
export declare function validateCandidateId(id: string): string;
//# sourceMappingURL=validators.d.ts.map