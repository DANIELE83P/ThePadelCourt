import { supabase } from '../lib/supabase';

/**
 * In-App Notification Service
 * Manages user notifications within the application
 */

export const NOTIFICATION_TYPES = {
    // User notifications
    LOYALTY_CARD_ASSIGNED: 'LOYALTY_CARD_ASSIGNED',
    PROMO_CARD_ASSIGNED: 'PROMO_CARD_ASSIGNED',
    STAMP_ADDED: 'STAMP_ADDED',
    REWARD_UNLOCKED: 'REWARD_UNLOCKED',
    LOW_BALANCE: 'LOW_BALANCE',
    DEADLINE_WARNING: 'DEADLINE_WARNING',
    TIER_EXPIRED: 'TIER_EXPIRED',
    BOOKING_CONFIRMED: 'BOOKING_CONFIRMED',

    // Admin notifications - Basic
    BOOKING_PENDING: 'BOOKING_PENDING',
    PROMO_EXPIRING: 'PROMO_EXPIRING',
    PROMO_EXPIRED: 'PROMO_EXPIRED',
    LOYALTY_TIER_UNLOCKED: 'LOYALTY_TIER_UNLOCKED',

    // Business & Performance
    MILESTONE_REACHED: 'MILESTONE_REACHED',
    LOW_OCCUPANCY: 'LOW_OCCUPANCY',
    HIGH_DEMAND: 'HIGH_DEMAND',

    // Gestione Utenti
    NEW_USER_REGISTERED: 'NEW_USER_REGISTERED',
    USER_INACTIVE: 'USER_INACTIVE',
    BLOCKED_USER_LOGIN_ATTEMPT: 'BLOCKED_USER_LOGIN_ATTEMPT',

    // Prenotazioni
    LATE_CANCELLATION: 'LATE_CANCELLATION',
    NO_CHECKIN_WARNING: 'NO_CHECKIN_WARNING',
    COURT_UNUSED: 'COURT_UNUSED',

    // Carte & Fedeltà
    CARD_NEVER_USED: 'CARD_NEVER_USED',
    CARD_ALMOST_EMPTY: 'CARD_ALMOST_EMPTY',
    FIRST_REWARD_CLAIMED: 'FIRST_REWARD_CLAIMED',
    POWER_USER_DETECTED: 'POWER_USER_DETECTED',

    // Sistema
    SCANNER_INACTIVE: 'SCANNER_INACTIVE',
    SYSTEM_ERRORS: 'SYSTEM_ERRORS',

    // Marketing
    POSITIVE_TREND: 'POSITIVE_TREND',
    DEAD_SLOTS: 'DEAD_SLOTS',
    USER_ANNIVERSARY: 'USER_ANNIVERSARY',

    // Finanziario
    PAYMENT_FAILED: 'PAYMENT_FAILED',
    DAILY_REVENUE_TARGET: 'DAILY_REVENUE_TARGET',

    // Sicurezza
    ADMIN_NEW_DEVICE: 'ADMIN_NEW_DEVICE',
    SENSITIVE_DATA_CHANGE: 'SENSITIVE_DATA_CHANGE'
};

/**
 * Create a new notification for a user
 */
export const createNotification = async (userId, { type, title, message, action_url, metadata }) => {
    try {
        const { data, error } = await supabase
            .from('user_notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                action_url,
                metadata
            })
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('[NotificationService] Error creating notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, limit = 20) => {
    try {
        const { data, error } = await supabase
            .from('user_notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('[NotificationService] Error fetching notifications:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Get unread count
 */
export const getUnreadCount = async (userId) => {
    try {
        const { count, error } = await supabase
            .from('user_notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return { success: true, count };
    } catch (error) {
        console.error('[NotificationService] Error fetching unread count:', error);
        return { success: false, count: 0 };
    }
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
    try {
        const { error } = await supabase
            .from('user_notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[NotificationService] Error marking as read:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
    try {
        const { error } = await supabase
            .from('user_notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[NotificationService] Error marking all as read:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
    try {
        const { error } = await supabase
            .from('user_notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('[NotificationService] Error deleting notification:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Subscribe to real-time notifications (optional)
 */
export const subscribeToNotifications = (userId, callback) => {
    const subscription = supabase
        .channel(`notifications:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'user_notifications',
                filter: `user_id=eq.${userId}`
            },
            (payload) => {
                callback(payload.new);
            }
        )
        .subscribe();

    return subscription;
};

export default {
    createNotification,
    getUserNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    subscribeToNotifications,
    NOTIFICATION_TYPES
};
