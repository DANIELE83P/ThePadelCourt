import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService';
import { emailService } from '../services/emailService';
import { supabase } from '../lib/supabase';

/**
 * Check notification preferences before sending
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
        console.error('[Notify] Error fetching preferences:', error);
        return { send_in_app: true, send_email: false };
    }
};

/**
 * Unified Notification System with Preference Flags
 * Handles both in-app notifications and email notifications
 */

export const notify = {
    /**
     * Send user credentials after account creation
     */
    sendCredentials: async ({ userId, email, firstName, password }) => {
        const prefs = await getPreferences('USER_CREDENTIALS');

        // In-App Notification
        if (prefs.send_in_app) {
            await createNotification(userId, {
                type: NOTIFICATION_TYPES.LOYALTY_CARD_ASSIGNED,
                title: 'Benvenuto!',
                message: `Il tuo account è stato creato. Controlla la tua email per le credenziali di accesso.`,
                action_url: '/login'
            });
        }

        // Email Notification
        if (prefs.send_email) {
            return await emailService.sendCredentials({ email, firstName, password });
        }
    },

    /**
     * Notify card assignment (Promo or Loyalty)
     */
    cardAssigned: async ({ userId, email, firstName, cardType, cardName, credits, stampsRequired, reward }) => {
        const prefs = await getPreferences('CARD_ASSIGNED');

        // In-App Notification
        if (prefs.send_in_app) {
            await createNotification(userId, {
                type: cardType === 'PROMO' ? NOTIFICATION_TYPES.PROMO_CARD_ASSIGNED : NOTIFICATION_TYPES.LOYALTY_CARD_ASSIGNED,
                title: '🎁 Nuova Carta Assegnata!',
                message: `Ti è stata assegnata: ${cardName}`,
                action_url: '/profile/cards'
            });
        }

        // Email Notification
        if (prefs.send_email) {
            return await emailService.sendCardAssigned({
                email,
                firstName,
                cardName,
                cardType,
                credits,
                stampsRequired,
                reward
            });
        }
    },

    /**
     * Confirm card usage (in-app only by default)
     */
    cardUsage: async ({ userId, cardName, action, remaining }) => {
        const prefs = await getPreferences('CARD_USAGE');

        if (prefs.send_in_app) {
            return await createNotification(userId, {
                type: NOTIFICATION_TYPES.STAMP_ADDED,
                title: '✅ Ingresso Registrato',
                message: `${action}! ${remaining}`,
                action_url: '/profile/cards'
            });
        }
    },

    /**
     * Low balance warning
     */
    lowBalance: async ({ userId, email, firstName, cardName, remaining }) => {
        const prefs = await getPreferences('LOW_BALANCE');

        // In-App Notification
        if (prefs.send_in_app) {
            await createNotification(userId, {
                type: NOTIFICATION_TYPES.LOW_BALANCE,
                title: '⚠️ Partite in Esaurimento',
                message: `Solo ${remaining} partite rimaste su ${cardName}`,
                action_url: '/profile/cards'
            });
        }

        // Email Notification
        if (prefs.send_email) {
            return await emailService.sendLowBalance({ email, firstName, cardName, remaining });
        }
    },

    /**
     * Reward unlocked notification
     */
    rewardUnlocked: async ({ userId, email, firstName, programName, reward, totalRewards }) => {
        const prefs = await getPreferences('REWARD_UNLOCKED');

        // In-App Notification
        if (prefs.send_in_app) {
            await createNotification(userId, {
                type: NOTIFICATION_TYPES.REWARD_UNLOCKED,
                title: '🏆 Premio Sbloccato!',
                message: `Hai sbloccato: ${reward}`,
                action_url: '/profile/cards'
            });
        }

        // Email Notification
        if (prefs.send_email) {
            return await emailService.sendRewardUnlocked({
                email,
                firstName,
                programName,
                reward,
                totalRewards
            });
        }
    },

    /**
     * Stamp added notification (in-app only by default)
     */
    stampAdded: async ({ userId, programName, currentStamps, totalRequired }) => {
        const prefs = await getPreferences('STAMP_ADDED');

        if (prefs.send_in_app) {
            const remaining = totalRequired - currentStamps;

            return await createNotification(userId, {
                type: NOTIFICATION_TYPES.STAMP_ADDED,
                title: '⭐ Timbro Aggiunto',
                message: `Hai ${currentStamps}/${totalRequired} timbri. Mancano ${remaining}!`,
                action_url: '/profile/cards'
            });
        }
    },

    /**
     * Deadline warning notification
     */
    deadlineWarning: async ({ userId, email, firstName, programName, reward, stampsNeeded, daysRemaining }) => {
        const prefs = await getPreferences('DEADLINE_WARNING');

        // In-App Notification
        if (prefs.send_in_app) {
            await createNotification(userId, {
                type: NOTIFICATION_TYPES.DEADLINE_WARNING,
                title: '⚠️ Premio a Rischio!',
                message: `Ti servono ${stampsNeeded} timbri entro ${daysRemaining} giorni per "${reward}"`,
                action_url: '/profile/cards'
            });
        }

        // Email Notification
        if (prefs.send_email) {
            return await emailService.sendDeadlineWarning({
                email,
                firstName,
                programName,
                reward,
                stampsNeeded,
                daysRemaining
            });
        }
    },

    /**
     * Tier expired notification
     */
    tierExpired: async ({ userId, email, firstName, programName, reward }) => {
        const prefs = await getPreferences('TIER_EXPIRED');

        // In-App Notification
        if (prefs.send_in_app) {
            await createNotification(userId, {
                type: NOTIFICATION_TYPES.TIER_EXPIRED,
                title: '⏱️ Premio Scaduto',
                message: `Il premio "${reward}" non è più disponibile (tempo scaduto)`,
                action_url: '/profile/cards'
            });
        }

        // Email Notification
        if (prefs.send_email) {
            return await emailService.sendTierExpired({ email, firstName, programName, reward });
        }
    },

    /**
     * Booking confirmation
     */
    bookingConfirmed: async ({ userId, courtName, date, time }) => {
        const prefs = await getPreferences('BOOKING_CONFIRMED');

        if (prefs.send_in_app) {
            return await createNotification(userId, {
                type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
                title: '✅ Prenotazione Confermata',
                message: `${courtName} - ${date} alle ${time}`,
                action_url: '/profile/reservations'
            });
        }
    },

    /**
     * Recurring Booking Created
     */
    bookingRecurringCreated: async ({ userId, email, firstName, courtName, dayOfWeek, time, startDate, endDate }) => {
        const prefs = await getPreferences('BOOKING_CONFIRMED'); // Reuse booking preference

        // In-App Notification
        if (prefs.send_in_app) {
            await createNotification(userId, {
                type: NOTIFICATION_TYPES.BOOKING_CONFIRMED,
                title: '🔄 Prenotazione Ricorrente Creata',
                message: `${courtName} - Ogni ${dayOfWeek} alle ${time}`,
                action_url: '/profile/reservations'
            });
        }

        // Email Notification
        if (prefs.send_email && email) {
            return await emailService.sendRecurringBookingConfirmation({
                email,
                firstName,
                courtName,
                dayOfWeek,
                time,
                startDate,
                endDate
            });
        }
    },

    // ==================== ADMIN NOTIFICATIONS ====================

    /**
     * Notify admin of pending booking (requires confirmation)
     */
    bookingPending: async ({ adminIds, bookingId, courtName, userName, date, time }) => {
        const prefs = await getPreferences('BOOKING_PENDING');

        // Send to all admin users
        for (const adminId of adminIds) {
            // In-App Notification
            if (prefs.send_in_app) {
                await createNotification(adminId, {
                    type: NOTIFICATION_TYPES.BOOKING_PENDING,
                    title: '📅 Nuova Prenotazione da Confermare',
                    message: `${userName} - ${courtName} - ${date} alle ${time}`,
                    action_url: `/ownerpage?section=calendar&booking=${bookingId}`,
                    metadata: { bookingId, courtName, userName, date, time }
                });
            }

            // Email Notification (TODO: add email template)
            if (prefs.send_email) {
                // await emailService.sendBookingPending(...)
                console.log('[Notify] Email for BOOKING_PENDING not implemented yet');
            }
        }
    },

    /**
     * Notify admin of expiring promo cards (7 days before)
     */
    promoExpiring: async ({ adminIds, cardName, userName, expiresAt, daysRemaining }) => {
        const prefs = await getPreferences('PROMO_EXPIRING');

        for (const adminId of adminIds) {
            if (prefs.send_in_app) {
                await createNotification(adminId, {
                    type: NOTIFICATION_TYPES.PROMO_EXPIRING,
                    title: `⏰ Promo in Scadenza (${daysRemaining}g)`,
                    message: `"${cardName}" di ${userName} scade il ${new Date(expiresAt).toLocaleDateString('it-IT')}`,
                    action_url: '/ownerpage?section=promo'
                });
            }
        }
    },

    /**
     * Notify admin of expired promo cards
     */
    promoExpired: async ({ adminIds, cardName, userName }) => {
        const prefs = await getPreferences('PROMO_EXPIRED');

        for (const adminId of adminIds) {
            if (prefs.send_in_app) {
                await createNotification(adminId, {
                    type: NOTIFICATION_TYPES.PROMO_EXPIRED,
                    title: '❌ Promo Scaduta',
                    message: `"${cardName}" di ${userName} è scaduta`,
                    action_url: '/ownerpage?section=promo'
                });
            }
        }
    },

    /**
     * Notify admin when user unlocks a tier (optional tracking)
     */
    loyaltyTierUnlocked: async ({ adminIds, userName, programName, tierReward }) => {
        const prefs = await getPreferences('LOYALTY_TIER_UNLOCKED');

        for (const adminId of adminIds) {
            if (prefs.send_in_app) {
                await createNotification(adminId, {
                    type: NOTIFICATION_TYPES.LOYALTY_TIER_UNLOCKED,
                    title: '🏆 Tier Sbloccato!',
                    message: `${userName} ha sbloccato "${tierReward}" in ${programName}`,
                    action_url: '/ownerpage?section=analytics'
                });
            }
        }
    }
};

export default notify;
