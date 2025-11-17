/**
 * Data anonymization helpers
 */
export type RedactedArray = [];
/**
 * Generate deterministic candidate alias like "candidate-12345"
 */
export declare function getCandidateAlias(id: string): string;
/**
 * Mask email into pattern like "as************9@**.**"
 */
export declare function maskEmail(email?: string | null): string;
/**
 * Return a redacted empty array for URL fields
 */
export declare function redactToEmptyArray(): RedactedArray;
/**
 * Mask phone numbers, keeping first and last character visible
 */
export declare function maskPhone(phone?: string | null): string | undefined;
//# sourceMappingURL=anonymizer.d.ts.map