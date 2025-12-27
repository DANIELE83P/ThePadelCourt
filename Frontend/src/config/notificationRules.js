/**
 * Notification Rules Configuration
 * Thresholds and settings for automatic admin notifications
 */

export const NOTIFICATION_RULES = {
    // Business & Performance
    MILESTONE_REACHED: {
        bookings: {
            daily: [10, 20, 50],
            weekly: [50, 100, 200],
            monthly: [200, 500, 1000]
        },
        revenue: {
            daily: [200, 500, 1000],
            weekly: [1000, 2500, 5000],
            monthly: [5000, 10000, 20000]
        },
        users: {
            total: [50, 100, 200, 500, 1000]
        }
    },

    LOW_OCCUPANCY: {
        threshold: 30, // %
        checkTime: '10:00', // Check at 10 AM for today
        enabled: true
    },

    HIGH_DEMAND: {
        threshold: 80, // %
        checkTime: ['10:00', '14:00', '18:00'], // Multiple checks
        enabled: true
    },

    // Gestione Utenti
    USER_INACTIVE: {
        daysSinceLastBooking: 30,
        enabled: true,
        checkDaily: true
    },

    NEW_USER_REGISTERED: {
        enabled: true,
        instantNotify: true
    },

    // Prenotazioni
    LATE_CANCELLATION: {
        hoursBeforeStart: 2,
        enabled: true,
        instantNotify: true
    },

    NO_CHECKIN_WARNING: {
        minutesBeforeStart: 10,
        enabled: true,
        autoCheck: true // Check automatically
    },

    COURT_UNUSED: {
        minutesAfterStart: 15,
        enabled: true,
        autoCheck: true
    },

    // Carte & Fedeltà
    CARD_NEVER_USED: {
        daysAfterAssignment: 7,
        enabled: true,
        checkDaily: true
    },

    CARD_ALMOST_EMPTY: {
        remainingThreshold: 2, // 2 partite rimanenti
        enabled: true,
        notifyOnce: true // Solo una volta per carta
    },

    FIRST_REWARD_CLAIMED: {
        enabled: true,
        instantNotify: true
    },

    POWER_USER_DETECTED: {
        bookingsThreshold: {
            week: 3,
            month: 10
        },
        enabled: true,
        notifyOnce: true // Solo la prima volta
    },

    // Sistema
    SCANNER_INACTIVE: {
        hoursSinceLastScan: 4,
        enabled: true,
        checkInterval: 60 // Check ogni ora
    },

    SYSTEM_ERRORS: {
        errorCount: 5,
        timeWindowMinutes: 10,
        enabled: true,
        instantNotify: true
    },

    // Marketing
    POSITIVE_TREND: {
        growthThreshold: 20, // % crescita
        comparisonPeriod: 'week', // week, month
        metrics: ['bookings', 'revenue', 'users'],
        enabled: true,
        checkDaily: true
    },

    DEAD_SLOTS: {
        weeksEmpty: 3,
        enabled: true,
        checkWeekly: true
    },

    USER_ANNIVERSARY: {
        milestones: [1, 2, 5, 10], // anni
        enabled: true,
        checkDaily: true
    },

    // Finanziario
    PAYMENT_FAILED: {
        enabled: true,
        instantNotify: true
    },

    DAILY_REVENUE_TARGET: {
        targets: {
            weekday: 300,
            weekend: 600
        },
        checkTime: '20:00',
        enabled: true
    },

    // Sicurezza
    ADMIN_NEW_DEVICE: {
        enabled: true,
        instantNotify: true,
        trackDevices: true
    },

    SENSITIVE_DATA_CHANGE: {
        enabled: true,
        instantNotify: true,
        trackedSettings: [
            'prices',
            'court_settings',
            'loyalty_programs',
            'promo_cards'
        ]
    }
};

/**
 * Helper to get rule config
 */
export const getRule = (eventType) => {
    return NOTIFICATION_RULES[eventType] || {};
};

/**
 * Helper to check if rule is enabled
 */
export const isRuleEnabled = (eventType) => {
    const rule = NOTIFICATION_RULES[eventType];
    return rule?.enabled !== false;
};

export default NOTIFICATION_RULES;
