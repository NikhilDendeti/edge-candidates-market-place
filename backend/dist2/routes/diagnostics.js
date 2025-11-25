/**
 * Diagnostics routes
 * For testing database connectivity and service role access
 */
import { Router } from 'express';
import { supabase } from '../config/supabase.js';
const router = Router();
/**
 * Test basic database connection
 */
router.get('/test-db', async (_req, res) => {
    try {
        // Test 1: Simple count query
        const { count, error: countError } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true });
        if (countError) {
            return res.status(500).json({
                success: false,
                test: 'simple_count',
                error: {
                    code: countError.code,
                    message: countError.message,
                    details: countError.details,
                    hint: countError.hint,
                },
            });
        }
        // Test 2: Fetch one student
        const { data: studentData, error: studentError } = await supabase
            .from('students')
            .select('user_id, full_name')
            .limit(1);
        if (studentError) {
            return res.status(500).json({
                success: false,
                test: 'fetch_one_student',
                error: {
                    code: studentError.code,
                    message: studentError.message,
                    details: studentError.details,
                    hint: studentError.hint,
                },
            });
        }
        // Test 3: Test nested query (simpler version)
        const { data: nestedData, error: nestedError } = await supabase
            .from('students')
            .select(`
        user_id,
        colleges (name, branch)
      `)
            .limit(1);
        if (nestedError) {
            return res.status(500).json({
                success: false,
                test: 'nested_query',
                error: {
                    code: nestedError.code,
                    message: nestedError.message,
                    details: nestedError.details,
                    hint: nestedError.hint,
                },
            });
        }
        // Test 4: Test complex nested query (the one that's failing)
        const { data: complexData, error: complexError } = await supabase
            .from('students')
            .select(`
        *,
        colleges (*),
        assessments (
          *,
          assessment_scores (
            *,
            score_types (*)
          )
        ),
        interviews (*)
      `)
            .limit(1);
        if (complexError) {
            return res.status(500).json({
                success: false,
                test: 'complex_nested_query',
                error: {
                    code: complexError.code,
                    message: complexError.message,
                    details: complexError.details,
                    hint: complexError.hint,
                },
                previousTests: {
                    simpleCount: { success: true, count },
                    fetchOne: { success: true, hasData: !!studentData?.length },
                    nestedQuery: { success: true, hasData: !!nestedData?.length },
                },
            });
        }
        // All tests passed
        return res.status(200).json({
            success: true,
            message: 'All database tests passed',
            results: {
                simpleCount: { count },
                fetchOne: {
                    success: true,
                    hasData: !!studentData?.length,
                    sample: studentData?.[0] || null,
                },
                nestedQuery: {
                    success: true,
                    hasData: !!nestedData?.length,
                    sample: nestedData?.[0] || null,
                },
                complexNestedQuery: {
                    success: true,
                    hasData: !!complexData?.length,
                    sample: complexData?.[0] ? {
                        id: complexData[0].user_id,
                        hasColleges: !!complexData[0].colleges,
                        hasAssessments: !!complexData[0].assessments,
                        hasInterviews: !!complexData[0].interviews,
                    } : null,
                },
            },
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            test: 'unexpected_error',
            error: {
                message: error?.message || 'Unknown error',
                stack: error?.stack,
            },
        });
    }
});
export default router;
//# sourceMappingURL=diagnostics.js.map