import { supabase } from '../lib/supabase';
import { notify } from '../utils/notification';

/**
 * Daily Scheduler Service
 * Executes maintenance tasks on first admin login of the day
 */

const STORAGE_KEY = 'last_scheduler_execution';

/**
 * Check if scheduler should run today
 */
export const shouldRunScheduler = () => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastExecution = localStorage.getItem(STORAGE_KEY);

    return lastExecution !== today;
};

/**
 * Mark scheduler as executed for today
 */
const markSchedulerExecuted = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(STORAGE_KEY, today);
};

/**
 * Main scheduler function
 */
export const runDailyScheduler = async (adminUserId) => {
    const startTime = Date.now();
    const today = new Date().toISOString().split('T')[0];

    console.log('[Scheduler] Starting daily maintenance...');

    let cardsScanned = 0;
    let warningsSent = 0;
    let cardsReset = 0;

    try {
        // Check if already executed today in database
        const { data: existingExecution } = await supabase
            .from('scheduler_executions')
            .select('id')
            .eq('execution_date', today)
            .maybeSingle();

        if (existingExecution) {
            console.log('[Scheduler] Already executed today');
            return { alreadyExecuted: true };
        }

        // 1. Scan all active loyalty cards with time-based rewards
        const { data: allActiveCards, error: cardsError } = await supabase
            .from('user_loyalty_cards')
            .select(`
                *,
                loyalty_programs(
                    id,
                    name,
                    has_time_based_rewards,
                    warning_days_before_reset
                )
            `)
            .eq('status', 'ACTIVE');

        if (cardsError) throw cardsError;

        // Filter cards in JS to avoid complex joining issues causing 400 errors
        const activeCards = (allActiveCards || []).filter(card =>
            card.loyalty_programs && card.loyalty_programs.has_time_based_rewards === true
        );

        cardsScanned = activeCards.length;

        // Fetch profiles separately
        const userIds = [...new Set(activeCards.map(c => c.user_id))];
        let profilesMap = {};

        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, first_name, name, email')
                .in('id', userIds);

            if (profiles) {
                profilesMap = profiles.reduce((acc, profile) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {});
            }
        }

        // 2. Process each card
        for (const card of activeCards || []) {
            const program = card.loyalty_programs;
            const cardStartDate = new Date(card.created_at);
            const daysSinceStart = Math.floor((Date.now() - cardStartDate) / (1000 * 60 * 60 * 24));

            // Get profile from map
            const userProfile = profilesMap[card.user_id] || {};
            const userEmail = userProfile.email;
            const firstName = userProfile.first_name || (userProfile.name ? userProfile.name.split(' ')[0] : 'Utente');

            // Fetch tiers for this program
            const { data: tiers } = await supabase
                .from('loyalty_reward_tiers')
                .select('*')
                .eq('program_id', program.id)
                .order('tier_level', { ascending: true });

            if (!tiers || tiers.length === 0) continue;

            const activeTiers = JSON.parse(card.active_tiers || '[]');
            const expiredTiers = JSON.parse(card.expired_tiers || '[]');
            let needsUpdate = false;
            let newExpiredTiers = [...expiredTiers];

            for (const tier of tiers) {
                const tierKey = `tier_${tier.tier_level}`;

                // Skip if already completed or expired
                if (activeTiers.includes(tierKey) || expiredTiers.includes(tierKey)) {
                    continue;
                }

                // Check if expired
                if (daysSinceStart > tier.time_limit_days) {
                    newExpiredTiers.push(tierKey);
                    needsUpdate = true;
                    cardsReset++;

                    // Send expiry notification
                    if (userEmail) {
                        await notify.tierExpired({
                            userId: card.user_id,
                            email: userEmail,
                            firstName: firstName,
                            programName: program.name,
                            reward: tier.reward_description
                        });
                    }

                    console.log(`[Scheduler] Expired tier ${tier.tier_level} for user ${card.user_id}`);
                }
                // Check if approaching deadline
                else {
                    const daysRemaining = tier.time_limit_days - daysSinceStart;
                    const stampsNeeded = tier.stamps_required - card.current_stamps;
                    const warningDays = program.warning_days_before_reset || 7;

                    if (daysRemaining <= warningDays && stampsNeeded > 0) {
                        // Send warning
                        if (userEmail) {
                            await notify.deadlineWarning({
                                userId: card.user_id,
                                email: userEmail,
                                firstName: firstName,
                                programName: program.name,
                                reward: tier.reward_description,
                                stampsNeeded,
                                daysRemaining
                            });
                            warningsSent++;
                            console.log(`[Scheduler] Warning sent for tier ${tier.tier_level} to user ${card.user_id}`);
                        }
                    }
                }
            }

            // Update card if tiers expired
            if (needsUpdate) {
                await supabase
                    .from('user_loyalty_cards')
                    .update({ expired_tiers: JSON.stringify(newExpiredTiers) })
                    .eq('id', card.id);
            }
        }

        // 3. Check promo cards expiring/expired
        const adminHelper = await import('../utils/adminHelper.js');
        const adminIds = await adminHelper.getAdminIds();

        const { data: promoCards } = await supabase
            .from('user_promo_cards')
            .select('*')
            .eq('status', 'ACTIVE')
            .not('expires_at', 'is', null);

        // Fetch profiles for promo cards
        const promoUserIds = [...new Set((promoCards || []).map(c => c.user_id))];
        let promoProfilesMap = {};
        if (promoUserIds.length > 0) {
            const { data: pProfiles } = await supabase
                .from('profiles')
                .select('id, first_name, name, email')
                .in('id', promoUserIds);

            if (pProfiles) {
                promoProfilesMap = pProfiles.reduce((acc, profile) => {
                    acc[profile.id] = profile;
                    return acc;
                }, {});
            }
        }

        for (const promoCard of promoCards || []) {
            const expiresAt = new Date(promoCard.expires_at);
            const daysUntilExpiry = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));

            const pProfile = promoProfilesMap[promoCard.user_id] || {};
            const userName = pProfile.first_name || pProfile.name || 'Utente';

            // Expired
            if (daysUntilExpiry < 0) {
                await notify.promoExpired({
                    adminIds,
                    cardName: promoCard.name,
                    userName
                });
            }
            // Expiring in 7 days
            else if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
                await notify.promoExpiring({
                    adminIds,
                    cardName: promoCard.name,
                    userName,
                    expiresAt: promoCard.expires_at,
                    daysRemaining: daysUntilExpiry
                });
            }
        }

        // 4. Send Booking Reminders (Trigger Edge Function)
        // Background check for daily reminders, handled by Edge Function idempotency
        try {
            const { data, error } = await supabase.functions.invoke('send-booking-reminders');
            if (error) {
                console.error('[Scheduler] Error sending reminders:', error);
            } else if (data?.skipped) {
                console.log('[Scheduler] Reminders already sent today.');
            } else {
                console.log(`[Scheduler] Reminders sent. Processed: ${data?.processed || 0}`);
            }
        } catch (remindersError) {
            console.error('[Scheduler] Failed to trigger reminders:', remindersError);
        }

        // 5. Log execution
        const executionTime = Date.now() - startTime;
        await supabase
            .from('scheduler_executions')
            .insert({
                execution_date: today,
                executed_by: adminUserId,
                cards_scanned: cardsScanned,
                warnings_sent: warningsSent,
                cards_reset: cardsReset,
                execution_time_ms: executionTime
            });

        markSchedulerExecuted();

        console.log(`[Scheduler] Completed: ${cardsScanned} cards scanned, ${warningsSent} warnings sent, ${cardsReset} cards reset in ${executionTime}ms`);

        return {
            success: true,
            stats: { cardsScanned, warningsSent, cardsReset, executionTime }
        };

    } catch (error) {
        console.error('[Scheduler] Error:', error);
        return { success: false, error: error.message };
    }
};

export default { shouldRunScheduler, runDailyScheduler };
