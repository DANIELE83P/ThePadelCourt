import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService';
import { supabase } from '../lib/supabase';

/**
 * Advanced Admin Notification Helpers
 * Comprehensive notification system for all admin events
 */

const getPreferences = async (eventType) => {
    try {
        const { data } = await supabase
            .from('notification_preferences')
            .select('send_in_app, send_email')
            .eq('event_type', eventType)
            .single();

        return data || { send_in_app: true, send_email: false };
    } catch (error) {
        return { send_in_app: true, send_email: false };
    }
};

export const advancedNotify = {
    // ==================== BUSINESS & PERFORMANCE ====================

    /**
     * Milestone reached (bookings, revenue, users)
     */
    milestoneReached: async ({ adminIds, type, value, threshold }) => {
        const prefs = await getPreferences('MILESTONE_REACHED');
        if (!prefs.send_in_app) return;

        const milestoneMessages = {
            bookings: `🎯 ${value} Prenotazioni!`,
            revenue: `💰 €${value} di Revenue!`,
            users: `👥 ${value} Utenti Registrati!`
        };

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.MILESTONE_REACHED,
                title: milestoneMessages[type] || '🎯 Traguardo Raggiunto!',
                message: `Hai raggiunto il traguardo di ${value} ${type}!`,
                action_url: '/ownerpage?section=analytics'
            });
        }
    },

    /**
     * Low occupancy alert
     */
    lowOccupancy: async ({ adminIds, occupancyRate, date }) => {
        const prefs = await getPreferences('LOW_OCCUPANCY');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.LOW_OCCUPANCY,
                title: '📉 Occupazione Bassa',
                message: `Solo ${occupancyRate}% campi prenotati per ${date}`,
                action_url: '/ownerpage?section=calendar',
                metadata: { occupancyRate, date }
            });
        }
    },

    /**
     * High demand alert
     */
    highDemand: async ({ adminIds, occupancyRate, date }) => {
        const prefs = await getPreferences('HIGH_DEMAND');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.HIGH_DEMAND,
                title: '🔥 Alta Domanda!',
                message: `${occupancyRate}% campi prenotati per ${date} - considera slot extra`,
                action_url: '/ownerpage?section=calendar',
                metadata: { occupancyRate, date }
            });
        }
    },

    // ==================== GESTIONE UTENTI ====================

    /**
     * New user registered
     */
    newUserRegistered: async ({ adminIds, userName, userId }) => {
        const prefs = await getPreferences('NEW_USER_REGISTERED');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.NEW_USER_REGISTERED,
                title: '👋 Nuovo Utente',
                message: `${userName} si è appena registrato`,
                action_url: '/ownerpage?section=users',
                metadata: { userId, userName }
            });
        }
    },

    /**
     * User inactive
     */
    userInactive: async ({ adminIds, userName, userId, daysSinceLastBooking }) => {
        const prefs = await getPreferences('USER_INACTIVE');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.USER_INACTIVE,
                title: '😴 Utente Inattivo',
                message: `${userName} non prenota da ${daysSinceLastBooking} giorni`,
                action_url: '/ownerpage?section=users',
                metadata: { userId, daysSinceLastBooking }
            });
        }
    },

    /**
     * Blocked user login attempt
     */
    blockedUserLoginAttempt: async ({ adminIds, userName, userId, attemptedAt }) => {
        const prefs = await getPreferences('BLOCKED_USER_LOGIN_ATTEMPT');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.BLOCKED_USER_LOGIN_ATTEMPT,
                title: '⚠️ Accesso Bloccato Tentato',
                message: `${userName} (account bloccato) ha tentato il login`,
                action_url: '/ownerpage?section=users',
                metadata: { userId, attemptedAt }
            });
        }
    },

    // ==================== PRENOTAZIONI ====================

    /**
     * Late cancellation
     */
    lateCancellation: async ({ adminIds, bookingId, courtName, userName, scheduledTime, cancelledAt }) => {
        const prefs = await getPreferences('LATE_CANCELLATION');
        if (!prefs.send_in_app) return;

        const hoursBeforeStart = Math.round((new Date(scheduledTime) - new Date(cancelledAt)) / (1000 * 60 * 60));

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.LATE_CANCELLATION,
                title: '⚡ Cancellazione Last Minute',
                message: `${userName} - ${courtName} alle ${scheduledTime} (${hoursBeforeStart}h prima)`,
                action_url: `/ownerpage?section=calendar&booking=${bookingId}`,
                metadata: { bookingId, courtName, userName, scheduledTime }
            });
        }
    },

    /**
     * No check-in warning
     */
    noCheckinWarning: async ({ adminIds, bookingId, courtName, userName, startTime }) => {
        const prefs = await getPreferences('NO_CHECKIN_WARNING');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.NO_CHECKIN_WARNING,
                title: '🚨 Mancato Check-in',
                message: `${courtName} alle ${startTime} - ${userName} non ha fatto check-in`,
                action_url: `/ownerpage?section=calendar&booking=${bookingId}`,
                metadata: { bookingId, courtName, startTime }
            });
        }
    },

    /**
     * Court unused (booked but no scan)
     */
    courtUnused: async ({ adminIds, bookingId, courtName, userName, scheduledTime }) => {
        const prefs = await getPreferences('COURT_UNUSED');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.COURT_UNUSED,
                title: '⏰ Campo Non Utilizzato',
                message: `${courtName} - ${userName} (${scheduledTime}) - nessun ingresso rilevato`,
                action_url: `/ownerpage?section=calendar&booking=${bookingId}`,
                metadata: { bookingId, courtName, scheduledTime }
            });
        }
    },

    // ==================== CARTE & FEDELTÀ ====================

    /**
     * Card never used
     */
    cardNeverUsed: async ({ adminIds, cardType, cardName, userName, userId, daysSinceAssignment }) => {
        const prefs = await getPreferences('CARD_NEVER_USED');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.CARD_NEVER_USED,
                title: '💤 Carta Non Attivata',
                message: `${cardName} di ${userName} mai usata da ${daysSinceAssignment} giorni`,
                action_url: '/ownerpage?section=users',
                metadata: { cardType, userName, userId, daysSinceAssignment }
            });
        }
    },

    /**
     * Card almost empty
     */
    cardAlmostEmpty: async ({ adminIds, cardName, userName, userId, remaining }) => {
        const prefs = await getPreferences('CARD_ALMOST_EMPTY');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.CARD_ALMOST_EMPTY,
                title: '⚠️ Carta in Esaurimento',
                message: `${userName} ha ${remaining} partite rimanenti su ${cardName}`,
                action_url: '/ownerpage?section=promo',
                metadata: { userName, userId, remaining }
            });
        }
    },

    /**
     * First reward claimed
     */
    firstRewardClaimed: async ({ adminIds, userName, userId, programName, reward }) => {
        const prefs = await getPreferences('FIRST_REWARD_CLAIMED');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.FIRST_REWARD_CLAIMED,
                title: '🎁 Primo Premio Riscattato!',
                message: `${userName} ha riscattato "${reward}" (${programName})`,
                action_url: '/ownerpage?section=loyalty',
                metadata: { userName, userId, programName, reward }
            });
        }
    },

    /**
     * Power user detected
     */
    powerUserDetected: async ({ adminIds, userName, userId, bookingCount, period }) => {
        const prefs = await getPreferences('POWER_USER_DETECTED');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.POWER_USER_DETECTED,
                title: '⭐ Power User!',
                message: `${userName} ha prenotato ${bookingCount} volte ${period}`,
                action_url: '/ownerpage?section=analytics',
                metadata: { userName, userId, bookingCount, period }
            });
        }
    },

    // ==================== SISTEMA ====================

    /**
     * Scanner inactive
     */
    scannerInactive: async ({ adminIds, hoursSinceLastScan }) => {
        const prefs = await getPreferences('SCANNER_INACTIVE');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.SCANNER_INACTIVE,
                title: '📱 Scanner Inattivo',
                message: `Nessuna scansione da ${hoursSinceLastScan} ore - possibile problema`,
                action_url: '/ownerpage?section=scanner',
                metadata: { hoursSinceLastScan }
            });
        }
    },

    /**
     * System errors
     */
    systemErrors: async ({ adminIds, errorCount, timeWindow }) => {
        const prefs = await getPreferences('SYSTEM_ERRORS');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.SYSTEM_ERRORS,
                title: '🔴 Errori di Sistema',
                message: `${errorCount} errori negli ultimi ${timeWindow} minuti`,
                action_url: '/ownerpage',
                metadata: { errorCount, timeWindow }
            });
        }
    },

    // ==================== MARKETING ====================

    /**
     * Positive trend
     */
    positiveTrend: async ({ adminIds, metric, growth, comparisonPeriod }) => {
        const prefs = await getPreferences('POSITIVE_TREND');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.POSITIVE_TREND,
                title: '📈 Trend Positivo!',
                message: `${metric}: +${growth}% vs ${comparisonPeriod}`,
                action_url: '/ownerpage?section=analytics',
                metadata: { metric, growth, comparisonPeriod }
            });
        }
    },

    /**
     * Dead slots recurring
     */
    deadSlots: async ({ adminIds, dayOfWeek, timeSlot, weeksEmpty }) => {
        const prefs = await getPreferences('DEAD_SLOTS');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.DEAD_SLOTS,
                title: '⏰ Slot Vuoti Ricorrenti',
                message: `${dayOfWeek} ${timeSlot} mai prenotato (${weeksEmpty} settimane)`,
                action_url: '/ownerpage?section=calendar',
                metadata: { dayOfWeek, timeSlot, weeksEmpty }
            });
        }
    },

    /**
     * User anniversary
     */
    userAnniversary: async ({ adminIds, userName, userId, yearsWithUs }) => {
        const prefs = await getPreferences('USER_ANNIVERSARY');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.USER_ANNIVERSARY,
                title: '🎂 Anniversario Utente',
                message: `${userName} è con noi da ${yearsWithUs} ${yearsWithUs === 1 ? 'anno' : 'anni'}!`,
                action_url: '/ownerpage?section=users',
                metadata: { userName, userId, yearsWithUs }
            });
        }
    },

    // ==================== FINANZIARIO ====================

    /**
     * Payment failed
     */
    paymentFailed: async ({ adminIds, userName, userId, amount, reason }) => {
        const prefs = await getPreferences('PAYMENT_FAILED');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.PAYMENT_FAILED,
                title: '❌ Pagamento Fallito',
                message: `${userName} - €${amount} (${reason})`,
                action_url: '/ownerpage?section=users',
                metadata: { userName, userId, amount, reason }
            });
        }
    },

    /**
     * Daily revenue target reached
     */
    dailyRevenueTarget: async ({ adminIds, revenue, target, date }) => {
        const prefs = await getPreferences('DAILY_REVENUE_TARGET');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.DAILY_REVENUE_TARGET,
                title: '💰 Target Raggiunto!',
                message: `€${revenue} oggi (target: €${target}) 🎉`,
                action_url: '/ownerpage?section=analytics',
                metadata: { revenue, target, date }
            });
        }
    },

    // ==================== SICUREZZA ====================

    /**
     * Admin new device login
     */
    adminNewDevice: async ({ adminIds, adminName, ipAddress, device }) => {
        const prefs = await getPreferences('ADMIN_NEW_DEVICE');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.ADMIN_NEW_DEVICE,
                title: '🔐 Nuovo Dispositivo Admin',
                message: `${adminName} - Login da ${device} (IP: ${ipAddress})`,
                action_url: '/ownerpage?section=settings',
                metadata: { adminName, ipAddress, device }
            });
        }
    },

    /**
     * Sensitive data changed
     */
    sensitiveDataChange: async ({ adminIds, changedBy, dataType, oldValue, newValue }) => {
        const prefs = await getPreferences('SENSITIVE_DATA_CHANGE');
        if (!prefs.send_in_app) return;

        for (const adminId of adminIds) {
            await createNotification(adminId, {
                type: NOTIFICATION_TYPES.SENSITIVE_DATA_CHANGE,
                title: '⚙️ Modifica Critica',
                message: `${changedBy} ha modificato ${dataType}`,
                action_url: '/ownerpage?section=settings',
                metadata: { changedBy, dataType, oldValue, newValue }
            });
        }
    }
};

export default advancedNotify;
