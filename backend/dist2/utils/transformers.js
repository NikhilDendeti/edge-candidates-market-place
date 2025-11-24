/**
 * Data transformation utilities
 * Transform database records to API response format
 */
import { getCandidateAlias, maskEmail, maskPhone, redactToEmptyArray } from './anonymizer.js';
/**
 * Format date to "DD MMM" format
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
}
/**
 * Calculate rating based on score percentage
 */
function calculateRating(score, max) {
    const percentage = (score / max) * 100;
    if (percentage >= 80)
        return 'Excellent';
    if (percentage >= 60)
        return 'Good';
    if (percentage >= 40)
        return 'Fair';
    return 'Poor';
}
/**
 * Derive skills from assessment scores
 */
function deriveSkills(assessmentScores) {
    if (!assessmentScores || assessmentScores.length === 0)
        return [];
    const skills = [];
    const threshold = 0.7; // 70%
    assessmentScores.forEach((as) => {
        if (!as.score_types)
            return;
        const percentage = as.score / as.max_score;
        if (as.score_types.key === 'coding' && percentage > threshold) {
            skills.push('Strong Problem Solving');
        }
        if (as.score_types.key === 'dsa' && percentage > threshold) {
            skills.push('Strong DSA');
        }
        if (as.score_types.key === 'cs_fund' && percentage > threshold) {
            skills.push('Strong Theory');
        }
    });
    return skills;
}
/**
 * Derive skills including communication from interview
 */
function deriveSkillsWithCommunication(assessmentScores, communicationRating) {
    const skills = deriveSkills(assessmentScores);
    // Communication rating is now out of 5, so threshold is 4 (80% of 5)
    if (communicationRating && communicationRating >= 4) {
        skills.push('Strong Communication');
    }
    return skills;
}
/**
 * Transform student record to Candidate type
 */
export function transformToCandidate(student) {
    const alias = getCandidateAlias(student.nxtwave_user_id);
    const latestAssessment = student.assessments?.[0];
    const latestInterview = student.interviews?.[0];
    // Format assessment score
    let assessmentScore = 'N/A';
    let assessmentMeta = 'No assessment';
    if (latestAssessment && latestAssessment.total_student_score && latestAssessment.total_assessment_score) {
        assessmentScore = `${latestAssessment.total_student_score} / ${latestAssessment.total_assessment_score}`;
        assessmentMeta = `Last taken: ${formatDate(latestAssessment.taken_at)}`;
    }
    // Format interview score
    let interviewScore = 'N/A';
    let interviewMeta = 'Not recorded';
    if (latestInterview) {
        // Use new overall_interview_score_out_of_100 if available, fallback to old field
        if (latestInterview.overall_interview_score_out_of_100 !== null && latestInterview.overall_interview_score_out_of_100 !== undefined) {
            interviewScore = `${latestInterview.overall_interview_score_out_of_100} / 100`;
        }
        else if (latestInterview.overall_interview_rating !== null && latestInterview.overall_interview_rating !== undefined) {
            interviewScore = `${latestInterview.overall_interview_rating} / 10`;
        }
        interviewMeta = latestInterview.recording_url ? 'Recorded' : 'Not recorded';
    }
    // Derive recommendation from interview or default
    const recommendation = latestInterview?.overall_label || 'Consider';
    return {
        id: student.nxtwave_user_id,
        name: alias,
        college: student.colleges?.name || '',
        branch: student.colleges?.branch || '',
        cgpa: student.cgpa?.toFixed(2) || '0.00',
        assessmentScore,
        assessmentMeta,
        interviewScore,
        interviewMeta,
        skills: deriveSkillsWithCommunication(latestAssessment?.assessment_scores, latestInterview?.communication_rating),
        recommendation,
        resumeUrl: redactToEmptyArray(),
    };
}
/**
 * Transform student record to StudentProfile type
 */
export function transformToStudentProfile(student) {
    const alias = getCandidateAlias(student.nxtwave_user_id);
    const latestAssessment = student.assessments?.[0];
    const latestInterview = student.interviews?.[0];
    const maskedEmail = student.email ? maskEmail(student.email) : undefined;
    const maskedPhone = student.phone ? maskPhone(student.phone) : undefined;
    // Calculate initials
    const initials = alias
        .replace(/[^a-z0-9]/gi, '')
        .slice(0, 2)
        .padEnd(2, 'X')
        .toUpperCase();
    // Build meta string
    const nirfText = student.colleges?.nirf_ranking ? ` (NIRF: ${student.colleges.nirf_ranking})` : '';
    const graduationText = student.graduation_year ? `Class of ${student.graduation_year}` : '';
    const meta = `${student.colleges?.name || ''}${nirfText} • ${student.colleges?.branch || ''} • ${graduationText}`.trim();
    // Format CGPA
    const cgpa = student.cgpa ? `${student.cgpa.toFixed(2)} / 10.0` : '0.00 / 10.0';
    // Assessment overall
    const assessmentOverall = latestAssessment && latestAssessment.percent
        ? {
            percentage: Math.round(latestAssessment.percent),
            raw: `${latestAssessment.total_student_score || 0} / ${latestAssessment.total_assessment_score || 0}`,
        }
        : { percentage: 0, raw: '0 / 0' };
    // Interview overall
    let interviewOverall = { percentage: 0, raw: '0 / 100' };
    if (latestInterview) {
        // Use new overall_interview_score_out_of_100 if available, fallback to old field
        if (latestInterview.overall_interview_score_out_of_100 !== null && latestInterview.overall_interview_score_out_of_100 !== undefined) {
            interviewOverall = {
                percentage: Math.round(latestInterview.overall_interview_score_out_of_100),
                raw: `${latestInterview.overall_interview_score_out_of_100} / 100`,
            };
        }
        else if (latestInterview.overall_interview_rating !== null && latestInterview.overall_interview_rating !== undefined) {
            interviewOverall = {
                percentage: Math.round(latestInterview.overall_interview_rating * 10),
                raw: `${latestInterview.overall_interview_rating} / 10`,
            };
        }
    }
    // Transform assessment scores
    const assessmentScores = [];
    if (latestAssessment?.assessment_scores && Array.isArray(latestAssessment.assessment_scores)) {
        latestAssessment.assessment_scores.forEach((as) => {
            // Only include if score_types relation exists
            if (as.score_types) {
                const percentage = (as.score / as.max_score) * 100;
                assessmentScores.push({
                    type: as.score_types.key || '',
                    label: as.score_types.display_name || '',
                    score: as.score,
                    maxScore: as.max_score,
                    percentage: Math.round(percentage),
                    rating: calculateRating(as.score, as.max_score),
                });
            }
        });
    }
    // Transform interview scores
    // Include scores even if they are 0 (but exclude if null/undefined)
    const interviewScores = [];
    if (latestInterview) {
        // Self Introduction (out of 5)
        if (latestInterview.self_intro_rating !== null && latestInterview.self_intro_rating !== undefined) {
            interviewScores.push({
                criteria: 'Self Introduction',
                score: latestInterview.self_intro_rating,
                max: 5,
                rating: calculateRating(latestInterview.self_intro_rating, 5),
            });
        }
        // Problem 1 Solving (out of 5) - NEW
        if (latestInterview.problem1_solving_rating !== null && latestInterview.problem1_solving_rating !== undefined) {
            interviewScores.push({
                criteria: 'Problem 1 Solving',
                score: latestInterview.problem1_solving_rating,
                max: 5,
                rating: calculateRating(latestInterview.problem1_solving_rating, 5),
            });
        }
        // Problem 2 Solving (out of 5) - NEW
        if (latestInterview.problem2_solving_rating !== null && latestInterview.problem2_solving_rating !== undefined) {
            interviewScores.push({
                criteria: 'Problem 2 Solving',
                score: latestInterview.problem2_solving_rating,
                max: 5,
                rating: calculateRating(latestInterview.problem2_solving_rating, 5),
            });
        }
        // Fallback to old problem_solving_rating if new fields not available
        if (interviewScores.filter(s => s.criteria.includes('Problem')).length === 0 &&
            latestInterview.problem_solving_rating !== null && latestInterview.problem_solving_rating !== undefined) {
            interviewScores.push({
                criteria: 'Problem Solving & Coding',
                score: latestInterview.problem_solving_rating,
                max: 35,
                rating: calculateRating(latestInterview.problem_solving_rating, 35),
            });
        }
        // Communication Skills (out of 5) - Updated from 9 to 5
        if (latestInterview.communication_rating !== null && latestInterview.communication_rating !== undefined) {
            interviewScores.push({
                criteria: 'Communication Skills',
                score: latestInterview.communication_rating,
                max: 5,
                rating: calculateRating(latestInterview.communication_rating, 5),
            });
        }
        // DSA Theory (out of 5) - NEW
        if (latestInterview.DSA_Theory !== null && latestInterview.DSA_Theory !== undefined) {
            interviewScores.push({
                criteria: 'DSA Theory',
                score: latestInterview.DSA_Theory,
                max: 5,
                rating: calculateRating(latestInterview.DSA_Theory, 5),
            });
        }
        // Core CS Theory (out of 5) - NEW
        if (latestInterview.Core_CS_Theory !== null && latestInterview.Core_CS_Theory !== undefined) {
            interviewScores.push({
                criteria: 'Core CS Theory',
                score: latestInterview.Core_CS_Theory,
                max: 5,
                rating: calculateRating(latestInterview.Core_CS_Theory, 5),
            });
        }
        // Fallback to old conceptual_rating if new fields not available
        if (interviewScores.filter(s => s.criteria.includes('Theory') || s.criteria.includes('Conceptual')).length === 0 &&
            latestInterview.conceptual_rating !== null && latestInterview.conceptual_rating !== undefined) {
            interviewScores.push({
                criteria: 'Conceptual & Theoretical',
                score: latestInterview.conceptual_rating,
                max: 6,
                rating: calculateRating(latestInterview.conceptual_rating, 6),
            });
        }
    }
    // All assessments
    const allAssessments = student.assessments?.map((a) => ({
        assessmentId: a.assessment_id,
        takenAt: a.taken_at,
        percent: a.percent || 0,
        reportUrl: redactToEmptyArray(),
    })) || [];
    // All interviews
    const allInterviews = student.interviews?.map((i) => ({
        interviewId: i.interview_id,
        interviewDate: i.interview_date,
        overallLabel: i.overall_label || 'Consider',
        recordingUrl: redactToEmptyArray(),
    })) || [];
    return {
        id: student.nxtwave_user_id,
        name: alias,
        initials,
        meta,
        cgpa,
        skills: deriveSkillsWithCommunication(latestAssessment?.assessment_scores, latestInterview?.communication_rating),
        gender: student.gender,
        phone: maskedPhone,
        email: maskedEmail,
        resumeUrl: redactToEmptyArray(),
        college: {
            name: student.colleges?.name || '',
            branch: student.colleges?.branch || '',
            nirfRanking: student.colleges?.nirf_ranking,
            city: student.colleges?.city,
            state: student.colleges?.state,
        },
        assessmentOverall,
        interviewOverall,
        latestAssessment: latestAssessment ? {
            assessmentId: latestAssessment.assessment_id,
            takenAt: latestAssessment.taken_at,
            reportUrl: redactToEmptyArray(),
            totalStudentScore: latestAssessment.total_student_score || 0,
            totalAssessmentScore: latestAssessment.total_assessment_score || 0,
            percent: latestAssessment.percent || 0,
            scores: assessmentScores,
        } : undefined,
        latestInterview: latestInterview ? {
            interviewId: latestInterview.interview_id,
            interviewDate: latestInterview.interview_date,
            recordingUrl: redactToEmptyArray(),
            scores: interviewScores,
            overallRating: latestInterview.overall_interview_score_out_of_100 !== null && latestInterview.overall_interview_score_out_of_100 !== undefined
                ? latestInterview.overall_interview_score_out_of_100
                : (latestInterview.overall_interview_rating || 0),
            overallLabel: latestInterview.overall_label || 'Consider',
            notes: latestInterview.notes,
            problem1_solving_rating: latestInterview.problem1_solving_rating,
            problem1_solving_rating_code: latestInterview.problem1_solving_rating_code,
            problem2_solving_rating: latestInterview.problem2_solving_rating,
            problem2_solving_rating_code: latestInterview.problem2_solving_rating_code,
            DSA_Theory: latestInterview.DSA_Theory,
            Core_CS_Theory: latestInterview.Core_CS_Theory,
            overall_interview_score_out_of_100: latestInterview.overall_interview_score_out_of_100,
        } : undefined,
        allAssessments,
        allInterviews,
    };
}
/**
 * Normalize branch name (same logic as frontend)
 */
export function normalizeBranchName(branch) {
    const normalized = branch.trim().toLowerCase();
    if (normalized.includes('computer science') || normalized.includes('cse') || normalized.includes('cs')) {
        return 'CSE';
    }
    if (normalized.includes('information technology') || normalized.includes('it')) {
        return 'IT';
    }
    if (normalized.includes('electronics') || normalized.includes('ece') || normalized.includes('e&c')) {
        return 'ECE';
    }
    if (normalized.includes('electrical') || normalized.includes('eee')) {
        return 'EEE';
    }
    if (normalized.includes('mechanical') || normalized.includes('me')) {
        return 'ME';
    }
    return branch.length <= 5 ? branch.toUpperCase() : branch.substring(0, 10);
}
//# sourceMappingURL=transformers.js.map