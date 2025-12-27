/**
 * NotificationAPI Configuration
 * 
 * Setup instructions:
 * 1. Go to https://app.notificationapi.com/
 * 2. Get your Client ID and Client Secret
 * 3. Replace the placeholder values below
 */

export const NOTIFICATION_CONFIG = {
    clientId: 'YOUR_CLIENT_ID_HERE',
    clientSecret: 'YOUR_CLIENT_SECRET_HERE',
    enabled: false // Set to true after adding credentials
};

/**
 * Notification IDs configured in NotificationAPI dashboard
 * These must match the IDs you create in the NotificationAPI web interface
 */
export const NOTIFICATION_IDS = {
    // User Management
    USER_CREDENTIALS: 'user_credentials',
    WELCOME_USER: 'welcome_user',

    // Card Management
    CARD_ASSIGNED: 'card_assigned',
    CARD_USAGE: 'card_usage',
    LOW_BALANCE: 'low_balance',
    CARD_EXHAUSTED: 'card_exhausted',

    // Loyalty System
    STAMP_ADDED: 'stamp_added',
    REWARD_UNLOCKED: 'reward_unlocked',
    REWARD_REDEEMED: 'reward_redeemed',

    // Booking System (optional)
    BOOKING_CONFIRMED: 'booking_confirmed',
    BOOKING_REMINDER: 'booking_reminder',
    BOOKING_CANCELLED: 'booking_cancelled'
};

export default NOTIFICATION_CONFIG;
