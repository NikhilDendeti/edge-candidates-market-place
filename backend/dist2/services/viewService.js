/**
 * View service
 * Handles candidate view tracking and queries
 */
import { supabase } from '../config/supabase.js';
import { NotFoundError, DatabaseError } from '../utils/errors.js';
import { getCandidateAlias, maskEmail, maskPhone } from '../utils/anonymizer.js';
/**
 * Log a candidate view
 */
export async function logCandidateView(candidateId, userData) {
    try {
        // 1. Verify candidate exists and get candidate name
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('full_name')
            .eq('user_id', candidateId)
            .single();
        if (studentError) {
            if (studentError.code === 'PGRST116') {
                throw new NotFoundError('Candidate');
            }
            throw studentError;
        }
        if (!student) {
            throw new NotFoundError('Candidate');
        }
        const candidateName = student.full_name;
        // 2. Find or create user
        let userId;
        // Try to find existing user
        const { data: existingUser, error: findError } = await supabase
            .from('users')
            .select('user_id')
            .eq('email', userData.email)
            .single();
        if (findError && findError.code !== 'PGRST116') {
            throw findError;
        }
        if (existingUser) {
            // User exists, use existing user_id
            userId = existingUser.user_id;
            // Update user info if provided (name, company, phone)
            const updateData = {};
            if (userData.name)
                updateData.name = userData.name;
            if (userData.company !== undefined)
                updateData.company = userData.company;
            if (userData.phone !== undefined)
                updateData.phone = userData.phone;
            if (Object.keys(updateData).length > 0) {
                const { error: updateError } = await supabase
                    .from('users')
                    .update(updateData)
                    .eq('user_id', userId);
                if (updateError) {
                    console.error('Error updating user:', updateError);
                    // Don't throw, just log - view logging should still succeed
                }
            }
        }
        else {
            // Create new user
            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                email: userData.email,
                name: userData.name,
                company: userData.company || null,
                phone: userData.phone || null,
            })
                .select('user_id')
                .single();
            if (createError) {
                throw new DatabaseError('Failed to create user', createError);
            }
            if (!newUser) {
                throw new DatabaseError('Failed to create user - no data returned');
            }
            userId = newUser.user_id;
        }
        // 3. Create view record
        const { data: viewRecord, error: viewError } = await supabase
            .from('candidate_views')
            .insert({
            user_id: userId,
            candidate_id: candidateId,
            candidate_name: candidateName,
            viewed_at: new Date().toISOString(),
        })
            .select('view_id, viewed_at')
            .single();
        if (viewError) {
            throw new DatabaseError('Failed to log view', viewError);
        }
        if (!viewRecord) {
            throw new DatabaseError('Failed to log view - no data returned');
        }
        return {
            message: 'View logged successfully',
            viewId: viewRecord.view_id,
            userId,
            candidateId,
            viewedAt: viewRecord.viewed_at,
        };
    }
    catch (error) {
        if (error instanceof NotFoundError || error instanceof DatabaseError) {
            throw error;
        }
        throw new DatabaseError('Failed to log candidate view', error);
    }
}
/**
 * Get user view history
 */
export async function getUserViewHistory(email, filters) {
    try {
        // 1. Find user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (userError) {
            if (userError.code === 'PGRST116') {
                throw new NotFoundError('User');
            }
            throw userError;
        }
        if (!user) {
            throw new NotFoundError('User');
        }
        const maskedUserEmail = maskEmail(user.email);
        // 2. Get total count
        const { count, error: countError } = await supabase
            .from('candidate_views')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.user_id);
        if (countError)
            throw countError;
        const total = count || 0;
        const totalPages = Math.ceil(total / filters.limit);
        const offset = (filters.page - 1) * filters.limit;
        // 3. Build query - fetch views and then join student data separately
        let query = supabase
            .from('candidate_views')
            .select('view_id, candidate_id, candidate_name, viewed_at')
            .eq('user_id', user.user_id);
        // Apply sorting
        if (filters.sort === 'candidate_name') {
            query = query.order('candidate_name', { ascending: filters.order === 'asc' });
        }
        else {
            // Default: sort by viewed_at
            query = query.order('viewed_at', { ascending: filters.order === 'asc' });
        }
        // Apply pagination
        query = query.range(offset, offset + filters.limit - 1);
        const { data: views, error: viewsError } = await query;
        if (viewsError)
            throw viewsError;
        // Fetch candidate details for all viewed candidates
        const candidateIds = [...new Set((views || []).map((v) => v.candidate_id))];
        const { data: studentsData } = await supabase
            .from('students')
            .select('user_id, cgpa, college_id, colleges(name, branch)')
            .in('user_id', candidateIds);
        // Create a map for quick lookup
        const candidateMap = new Map((studentsData || []).map((s) => [
            s.user_id,
            {
                cgpa: s.cgpa?.toFixed(2),
                college: s.colleges?.name,
                branch: s.colleges?.branch,
            },
        ]));
        // Transform data
        const data = (views || []).map((view) => ({
            viewId: view.view_id,
            candidateId: view.candidate_id,
            candidateName: getCandidateAlias(view.candidate_id),
            viewedAt: view.viewed_at,
            candidate: candidateMap.get(view.candidate_id),
        }));
        return {
            user: {
                userId: user.user_id,
                email: maskedUserEmail,
                name: user.name,
                company: user.company || undefined,
                phone: user.phone ? maskPhone(user.phone) : undefined,
            },
            data,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages,
            },
        };
    }
    catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Failed to fetch user view history', error);
    }
}
/**
 * Get candidate viewers
 */
export async function getCandidateViewers(candidateId, filters) {
    try {
        // 1. Verify candidate exists and get name
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('full_name')
            .eq('user_id', candidateId)
            .single();
        if (studentError) {
            if (studentError.code === 'PGRST116') {
                throw new NotFoundError('Candidate');
            }
            throw studentError;
        }
        if (!student) {
            throw new NotFoundError('Candidate');
        }
        const candidateAlias = getCandidateAlias(candidateId);
        // 2. Get statistics
        const { count: totalViews, error: statsError } = await supabase
            .from('candidate_views')
            .select('user_id', { count: 'exact', head: true })
            .eq('candidate_id', candidateId);
        if (statsError)
            throw statsError;
        // Get unique viewers count
        const { data: uniqueViewersData, error: uniqueError } = await supabase
            .from('candidate_views')
            .select('user_id')
            .eq('candidate_id', candidateId);
        if (uniqueError)
            throw uniqueError;
        const uniqueViewers = new Set((uniqueViewersData || []).map((v) => v.user_id)).size;
        // 3. Get paginated views
        const total = totalViews || 0;
        const totalPages = Math.ceil(total / filters.limit);
        const offset = (filters.page - 1) * filters.limit;
        // Build query - fetch views and join user data separately
        let query = supabase
            .from('candidate_views')
            .select('view_id, user_id, viewed_at')
            .eq('candidate_id', candidateId);
        // Apply sorting
        if (filters.sort === 'user_name') {
            // Need to sort by user name, which requires joining
            query = query.order('viewed_at', { ascending: filters.order === 'asc' });
        }
        else {
            // Default: sort by viewed_at
            query = query.order('viewed_at', { ascending: filters.order === 'asc' });
        }
        // Apply pagination
        query = query.range(offset, offset + filters.limit - 1);
        const { data: views, error: viewsError } = await query;
        if (viewsError)
            throw viewsError;
        // Fetch user details for all viewers
        const userIds = [...new Set((views || []).map((v) => v.user_id))];
        const { data: usersData } = await supabase
            .from('users')
            .select('user_id, email, name, company, phone')
            .in('user_id', userIds);
        // Create a map for quick lookup
        const userMap = new Map((usersData || []).map((u) => [
            u.user_id,
            {
                userId: u.user_id,
                email: maskEmail(u.email),
                name: u.name,
                company: u.company || undefined,
                phone: u.phone ? maskPhone(u.phone) : undefined,
            },
        ]));
        // Transform and sort by user_name if needed
        let data = (views || []).map((view) => ({
            viewId: view.view_id,
            userId: view.user_id,
            user: userMap.get(view.user_id) || {
                userId: view.user_id,
                email: maskEmail(undefined),
                name: 'Unknown',
            },
            viewedAt: view.viewed_at,
        }));
        // Post-query sort by user_name if needed
        if (filters.sort === 'user_name') {
            data.sort((a, b) => {
                const nameA = a.user.name.toLowerCase();
                const nameB = b.user.name.toLowerCase();
                return filters.order === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
            });
        }
        return {
            candidate: {
                candidateId,
                candidateName: candidateAlias,
                totalViews: total,
                uniqueViewers,
            },
            data,
            pagination: {
                page: filters.page,
                limit: filters.limit,
                total,
                totalPages,
            },
        };
    }
    catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Failed to fetch candidate viewers', error);
    }
}
/**
 * Get user view statistics
 */
export async function getUserViewStats(email) {
    try {
        // 1. Find user
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        if (userError) {
            if (userError.code === 'PGRST116') {
                throw new NotFoundError('User');
            }
            throw userError;
        }
        if (!user) {
            throw new NotFoundError('User');
        }
        const maskedEmail = maskEmail(user.email);
        // 2. Get all views for this user
        const { data: views, error: viewsError } = await supabase
            .from('candidate_views')
            .select('candidate_id, viewed_at')
            .eq('user_id', user.user_id)
            .order('viewed_at', { ascending: true });
        if (viewsError)
            throw viewsError;
        const viewsList = views || [];
        // Calculate statistics
        const totalViews = viewsList.length;
        const uniqueCandidates = new Set(viewsList.map((v) => v.candidate_id)).size;
        const firstViewAt = viewsList.length > 0 ? viewsList[0].viewed_at : undefined;
        const lastViewAt = viewsList.length > 0 ? viewsList[viewsList.length - 1].viewed_at : undefined;
        // Group views by date (India timezone)
        const viewsByDateMap = {};
        viewsList.forEach((view) => {
            const date = new Date(view.viewed_at);
            // Convert to India timezone (IST = UTC+5:30)
            // Format date in IST using Intl.DateTimeFormat
            const formatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
            });
            const dateStr = formatter.format(date); // Returns YYYY-MM-DD format
            viewsByDateMap[dateStr] = (viewsByDateMap[dateStr] || 0) + 1;
        });
        // Convert to array and sort by date (descending)
        const viewsByDate = Object.entries(viewsByDateMap)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 30); // Limit to last 30 days
        return {
            user: {
                userId: user.user_id,
                email: maskedEmail,
                name: user.name,
                company: user.company || undefined,
                phone: user.phone ? maskPhone(user.phone) : undefined,
            },
            stats: {
                totalViews,
                uniqueCandidates,
                firstViewAt,
                lastViewAt,
                viewsByDate,
            },
        };
    }
    catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        throw new DatabaseError('Failed to fetch user view statistics', error);
    }
}
//# sourceMappingURL=viewService.js.map