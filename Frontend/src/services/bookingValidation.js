import { supabase } from '../lib/supabase';

/**
 * Booking Validation Service
 * Validates booking slots against club hours, closures, and pricing
 */

/**
 * Get club hours for a specific day
 */
export const getClubHours = async (dayOfWeek) => {
    try {
        const { data, error } = await supabase
            .from('club_hours')
            .select('*')
            .eq('day_of_week', dayOfWeek)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('[BookingValidation] Error fetching club hours:', error);
        return null;
    }
};

/**
 * Get active closures for a date
 */
export const getActiveClosures = async (date) => {
    try {
        const { data, error } = await supabase
            .from('club_closures')
            .select('*')
            .eq('is_active', true)
            .lte('start_date', date)
            .gte('end_date', date);

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('[BookingValidation] Error fetching closures:', error);
        return [];
    }
};

/**
 * Check if two time ranges overlap
 */
const isTimeOverlapping = (start1, end1, start2, end2) => {
    return start1 < end2 && end1 > start2;
};

/**
 * Validate a booking slot
 */
export const validateBookingSlot = async (courtId, date, timeStart, timeEnd) => {
    const errors = [];
    let price = null;
    let pricingRule = null;

    try {
        const bookingDate = new Date(date);
        const dayOfWeek = bookingDate.getDay(); // 0=Sunday, 6=Saturday

        // 1. Check club hours
        const clubHours = await getClubHours(dayOfWeek);

        if (!clubHours) {
            errors.push('Orari del club non configurati per questo giorno');
        } else if (!clubHours.is_open) {
            errors.push('Il club è chiuso questo giorno');
        } else {
            // Check opening hours
            if (timeStart < clubHours.open_time || timeEnd > clubHours.close_time) {
                errors.push(`Orario fuori dagli orari di apertura (${clubHours.open_time}-${clubHours.close_time})`);
            }

            // Check break time
            if (clubHours.break_start && clubHours.break_end) {
                if (isTimeOverlapping(timeStart, timeEnd, clubHours.break_start, clubHours.break_end)) {
                    errors.push(`Orario sovrapposto con pausa (${clubHours.break_start}-${clubHours.break_end})`);
                }
            }
        }

        // 2. Check closures
        const closures = await getActiveClosures(date);
        if (closures.length > 0) {
            const closure = closures[0];
            errors.push(`Chiusura attiva: ${closure.title}`);
        }

        // 3. Calculate price
        const pricing = await getApplicablePricing(courtId, date, timeStart, dayOfWeek);
        if (pricing) {
            price = pricing.price;
            pricingRule = pricing.name;
        }

        return {
            isValid: errors.length === 0,
            errors,
            price,
            pricingRule,
            warnings: [] // For future use (e.g., weather warnings)
        };

    } catch (error) {
        console.error('[BookingValidation] Error validating slot:', error);
        return {
            isValid: false,
            errors: ['Errore durante la validazione'],
            price: null,
            pricingRule: null,
            warnings: []
        };
    }
};

/**
 * Get applicable pricing for a court at a specific time
 */
export const getApplicablePricing = async (courtId, date, timeStart, dayOfWeek) => {
    try {
        const { data, error } = await supabase
            .from('court_pricing')
            .select('*')
            .eq('court_id', courtId)
            .eq('is_active', true)
            .order('priority', { ascending: false }); // Higher priority first

        if (error) throw error;

        if (!data || data.length === 0) return null;

        // Filter rules by date validity and day of week
        const validRules = data.filter(rule => {
            // Check date validity
            if (rule.valid_from && date < rule.valid_from) return false;
            if (rule.valid_until && date > rule.valid_until) return false;

            // Check day of week
            if (rule.day_of_week && rule.day_of_week.length > 0) {
                if (!rule.day_of_week.includes(dayOfWeek)) return false;
            }

            // Check time range
            if (timeStart >= rule.time_start && timeStart < rule.time_end) {
                return true;
            }

            return false;
        });

        // Return highest priority matching rule
        return validRules.length > 0 ? validRules[0] : null;

    } catch (error) {
        console.error('[BookingValidation] Error fetching pricing:', error);
        return null;
    }
};

/**
 * Check if a slot is available (not already booked)
 */
export const isSlotAvailable = async (courtId, date, timeStart, timeEnd) => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select('id')
            .eq('court_id', courtId)
            .eq('court_id', courtId)
            .eq('booking_date', date)
            .neq('status', 'cancelled')
            .or(`and(time_slot_start.lt.${timeEnd},time_slot_end.gt.${timeStart})`);

        if (error) throw error;

        return !data || data.length === 0;
    } catch (error) {
        console.error('[BookingValidation] Error checking availability:', error);
        return false;
    }
};

export default {
    validateBookingSlot,
    getClubHours,
    getActiveClosures,
    getApplicablePricing,
    isSlotAvailable
};
