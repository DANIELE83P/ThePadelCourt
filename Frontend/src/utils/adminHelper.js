import { supabase } from '../lib/supabase';

/**
 * Admin Helper Functions
 * Utility functions for admin operations
 */

/**
 * Get all admin/owner user IDs
 */
export const getAdminIds = async () => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id')
            .in('role', ['owner', 'admin']);

        if (error) throw error;
        return data?.map(profile => profile.id) || [];
    } catch (error) {
        console.error('[AdminHelper] Error fetching admin IDs:', error);
        return [];
    }
};

/**
 * Get admin users with their emails
 */
export const getAdminUsers = async () => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, first_name')
            .in('role', ['owner', 'admin']);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[AdminHelper] Error fetching admin users:', error);
        return [];
    }
};

export default {
    getAdminIds,
    getAdminUsers
};
