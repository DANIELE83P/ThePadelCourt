import { supabase } from '../lib/supabase';

/**
 * Internal Email Service
 * Sends emails using templates stored in the database
 * Uses Supabase Edge Functions or third-party email service
 */

/**
 * Render template with variables
 */
const renderTemplate = (template, variables) => {
    let subject = template.subject;
    let htmlBody = template.html_body;
    let textBody = template.text_body || '';

    // Replace all {{variable}} occurrences
    Object.keys(variables).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        const value = variables[key] || '';

        subject = subject.replace(regex, value);
        htmlBody = htmlBody.replace(regex, value);
        textBody = textBody.replace(regex, value);
    });

    // Handle conditional blocks {{#if variable}}...{{/if}}
    // Simple implementation - can be enhanced
    const conditionalRegex = /{{#if\s+(\w+)}}(.*?){{\/if}}/gs;

    htmlBody = htmlBody.replace(conditionalRegex, (match, varName, content) => {
        return variables[varName] ? content : '';
    });

    textBody = textBody.replace(conditionalRegex, (match, varName, content) => {
        return variables[varName] ? content : '';
    });

    return { subject, htmlBody, textBody };
};

/**
 * Get template from database
 */
const getTemplate = async (templateKey) => {
    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_key', templateKey)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error(`[EmailService] Error fetching template ${templateKey}:`, error);
        return null;
    }
};

/**
 * Send email using Supabase Edge Function + NotificationAPI
 */
const sendEmail = async (templateKey, recipientEmail, variables, userId) => {
    try {
        const { data, error } = await supabase.functions.invoke('send-email-notification', {
            body: {
                to: recipientEmail,
                templateKey,
                variables,
                userId
            }
        });

        if (error) throw error;

        console.log('[EmailService] Email sent via Edge Function:', { templateKey, to: recipientEmail });
        return { success: true };

    } catch (error) {
        console.error('[EmailService] Error sending email:', error);

        // Fallback: log to console for development
        console.log('[EmailService] FALLBACK - Email details:', {
            templateKey,
            to: recipientEmail,
            variables
        });

        return { success: false, error: error.message };
    }
};

/**
 * Main email sending function
 */
export const sendTemplateEmail = async (templateKey, recipientEmail, variables, userId = null) => {
    return await sendEmail(templateKey, recipientEmail, variables, userId);
};

/**
 * Email shortcuts for common scenarios
 */
export const emailService = {
    /**
     * Send user credentials
     */
    sendCredentials: async ({ email, firstName, password }) => {
        return await sendTemplateEmail('user_credentials', email, {
            firstName,
            email,
            password,
            loginUrl: window.location.origin + '/login',
            clubName: 'The Padel Court'
        });
    },

    /**
     * Send card assigned notification
     */
    sendCardAssigned: async ({ email, firstName, cardName, cardType, credits, stampsRequired, reward }) => {
        return await sendTemplateEmail('card_assigned', email, {
            firstName,
            cardName,
            cardType,
            credits: credits || '',
            stampsRequired: stampsRequired || '',
            reward: reward || '',
            cardsUrl: window.location.origin + '/profile/cards',
            clubName: 'The Padel Court'
        });
    },

    /**
     * Send reward unlocked notification
     */
    sendRewardUnlocked: async ({ email, firstName, programName, reward, totalRewards }) => {
        return await sendTemplateEmail('reward_unlocked', email, {
            firstName,
            programName,
            reward,
            totalRewards: totalRewards.toString(),
            clubName: 'The Padel Court'
        });
    },

    /**
     * Send low balance warning
     */
    sendLowBalance: async ({ email, firstName, cardName, remaining }) => {
        return await sendTemplateEmail('low_balance', email, {
            firstName,
            cardName,
            remaining: remaining.toString(),
            renewUrl: window.location.origin + '/profile/cards',
            clubName: 'The Padel Court'
        });
    },

    /**
     * Send deadline warning
     */
    sendDeadlineWarning: async ({ email, firstName, programName, reward, stampsNeeded, daysRemaining }) => {
        return await sendTemplateEmail('deadline_warning', email, {
            firstName,
            programName,
            reward,
            stampsNeeded: stampsNeeded.toString(),
            daysRemaining: daysRemaining.toString(),
            clubName: 'The Padel Court'
        });
    },

    /**
     * Send tier expired notification
     */
    sendTierExpired: async ({ email, firstName, programName, reward }) => {
        return await sendTemplateEmail('tier_expired', email, {
            firstName,
            programName,
            reward,
            clubName: 'The Padel Court'
        });
    },
    /**
     * Send recurring booking confirmation
     */
    sendRecurringBookingConfirmation: async ({ email, firstName, courtName, dayOfWeek, time, startDate, endDate }) => {
        return await sendTemplateEmail('recurring_booking_confirmed', email, {
            firstName,
            courtName,
            dayOfWeek,
            time,
            startDate,
            endDate: endDate || 'Illimitata',
            reservationsUrl: window.location.origin + '/profile/reservations',
            clubName: 'The Padel Court'
        });
    }
};

export default emailService;
