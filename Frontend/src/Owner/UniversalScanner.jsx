import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { QrCode, CheckCircle, XCircle, AlertCircle, CreditCard, Award, Clock, Trophy } from "lucide-react";
import { createNotification, NOTIFICATION_TYPES } from '../services/notificationService';
import { notify } from '../utils/notification';

const UniversalScanner = () => {
    const { user } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannerActive, setScannerActive] = useState(true);
    const [cardData, setCardData] = useState(null);
    const [cardType, setCardType] = useState(null);
    const [actionResult, setActionResult] = useState(null);

    const scannerRef = useRef(null);

    useEffect(() => {
        if (!scannerActive) return;

        const scannerId = "reader";
        const timeout = setTimeout(() => {
            if (document.getElementById(scannerId)) {
                const scanner = new Html5QrcodeScanner(
                    scannerId,
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    false
                );

                scanner.render(onScanSuccess, onScanFailure);
                scannerRef.current = scanner;
            }
        }, 100);

        return () => {
            clearTimeout(timeout);
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error);
            }
        };
    }, [scannerActive]);

    const onScanSuccess = async (decodedText) => {
        if (loading) return;

        if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
        }
        setScannerActive(false);
        setScanResult(decodedText);
        setLoading(true);

        try {
            await fetchCardData(decodedText);
        } catch (err) {
            console.error(err);
            setError("Errore nella verifica del codice.");
        } finally {
            setLoading(false);
        }
    };

    const onScanFailure = (error) => {
        // Just noise
    };

    const fetchCardData = async (code) => {
        setError(null);
        setCardData(null);
        setCardType(null);
        setActionResult(null);

        // 1. Try Promo Cards
        const { data: promo } = await supabase
            .from('user_promo_cards')
            .select('*, profiles:user_id(name, first_name, email)')
            .eq('card_code', code)
            .single();

        if (promo) {
            setCardType('PROMO');
            setCardData(promo);
            return;
        }

        // 2. Try Loyalty Cards
        const { data: loyalty } = await supabase
            .from('user_loyalty_cards')
            .select(`
                *, 
                profiles:user_id(name, first_name, email), 
                loyalty_programs(
                    name, 
                    stamps_required, 
                    reward_description, 
                    has_time_based_rewards,
                    warning_days_before_reset
                )
            `)
            .eq('card_code', code)
            .single();

        if (loyalty) {
            setCardType('LOYALTY');
            setCardData(loyalty);
            return;
        }

        setError("Carta non trovata nel sistema.");
    };

    const handlePromoAction = async () => {
        setLoading(true);
        try {
            // Check active and credits
            if (cardData.status !== 'ACTIVE') {
                setError("Questa carta non è attiva.");
                return;
            }

            if (cardData.current_credits <= 0) {
                setError("Carta esaurita. Nessun credito disponibile.");
                return;
            }

            const newCredits = cardData.current_credits - 1;

            // Update card
            const { error: updateError } = await supabase
                .from('user_promo_cards')
                .update({ current_credits: newCredits })
                .eq('id', cardData.id);

            if (updateError) throw updateError;

            // Log usage
            await supabase.from('card_usage_logs').insert({
                card_type: 'PROMO',
                card_id: cardData.id,
                user_id: cardData.user_id,
                action: 'CREDIT_DEDUCTED',
                credits_remaining: newCredits
            });

            // In-App Notification
            await createNotification(cardData.user_id, {
                type: NOTIFICATION_TYPES.STAMP_ADDED, // Reusing for card usage
                title: '✅ Ingresso Registrato',
                message: `Partita scalata! Ti restano ${newCredits} partite disponibili.`,
                action_url: '/profile/cards'
            });

            // Email Notification
            await notify.cardUsage({
                userId: cardData.user_id,
                email: cardData.profiles.email,
                firstName: cardData.profiles.first_name || cardData.profiles.name,
                cardName: 'Promo Card',
                action: 'Partita scalata',
                remaining: `${newCredits} partite`
            });

            // Low balance warning
            if (newCredits <= 2 && newCredits > 0) {
                await createNotification(cardData.user_id, {
                    type: NOTIFICATION_TYPES.LOW_BALANCE,
                    title: '⚠️ Partite in Esaurimento',
                    message: `Attenzione! Ti rimangono solo ${newCredits} partite.`,
                    action_url: '/profile/cards'
                });

                await notify.lowBalance({
                    userId: cardData.user_id,
                    email: cardData.profiles.email,
                    firstName: cardData.profiles.first_name || cardData.profiles.name,
                    cardName: 'Promo Card',
                    remaining: newCredits
                });
            }

            setActionResult({
                success: true,
                message: `Ingresso registrato! Crediti rimanenti: ${newCredits}`
            });

        } catch (error) {
            console.error('Error processing promo:', error);
            setError('Errore durante la registrazione.');
        } finally {
            setLoading(false);
        }
    };

    const handleLoyaltyAction = async () => {
        setLoading(true);
        try {
            if (cardData.status !== 'ACTIVE') {
                setError("Questa carta non è attiva.");
                return;
            }

            const program = cardData.loyalty_programs;
            const newStamps = cardData.current_stamps + 1;

            // Fetch tiers if time-based
            let tiers = [];
            let earnedTier = null;

            if (program.has_time_based_rewards) {
                const { data: tiersData } = await supabase
                    .from('loyalty_reward_tiers')
                    .select('*')
                    .eq('program_id', cardData.program_id)
                    .order('tier_level', { ascending: true });

                tiers = tiersData || [];

                // Calculate days since start
                const cardStartDate = new Date(cardData.created_at);
                const daysSinceStart = Math.floor((Date.now() - cardStartDate) / (1000 * 60 * 60 * 24));

                // Check active tiers
                const activeTiers = JSON.parse(cardData.active_tiers || '[]');
                const expiredTiers = JSON.parse(cardData.expired_tiers || '[]');

                // Update tier status and find earned tier
                for (const tier of tiers) {
                    const tierKey = `tier_${tier.tier_level}`;

                    // Skip already expired tiers
                    if (expiredTiers.includes(tierKey)) continue;

                    // Check if tier expired
                    if (daysSinceStart > tier.time_limit_days) {
                        expiredTiers.push(tierKey);

                        // Notify expire
                        await createNotification(cardData.user_id, {
                            type: NOTIFICATION_TYPES.TIER_EXPIRED,
                            title: '⏱️ Premio Scaduto',
                            message: `Il premio "${tier.reward_description}" non è più disponibile (tempo scaduto).`,
                            action_url: '/profile/cards'
                        });
                        continue;
                    }

                    // Check if tier completed
                    if (newStamps >= tier.stamps_required && !activeTiers.includes(tierKey)) {
                        activeTiers.push(tierKey);
                        earnedTier = tier;
                    }

                    // Warning notifications (3 days before deadline)
                    const daysRemaining = tier.time_limit_days - daysSinceStart;
                    const stampsNeeded = tier.stamps_required - newStamps;

                    if (daysRemaining <= (program.warning_days_before_reset || 7) && stampsNeeded > 0 && !activeTiers.includes(tierKey) && !expiredTiers.includes(tierKey)) {
                        await createNotification(cardData.user_id, {
                            type: NOTIFICATION_TYPES.DEADLINE_WARNING,
                            title: '⚠️ Premio a Rischio!',
                            message: `Ti servono ancora ${stampsNeeded} timbri entro ${daysRemaining} giorni per "${tier.reward_description}"!`,
                            action_url: '/profile/cards'
                        });
                    }
                }

                // Update card with tier status
                await supabase
                    .from('user_loyalty_cards')
                    .update({
                        current_stamps: newStamps,
                        last_stamp_at: new Date().toISOString(),
                        active_tiers: JSON.stringify(activeTiers),
                        expired_tiers: JSON.stringify(expiredTiers),
                        ...(earnedTier ? { rewards_earned: cardData.rewards_earned + 1 } : {})
                    })
                    .eq('id', cardData.id);

            } else {
                // Standard logic
                let updateData = {
                    current_stamps: newStamps,
                    last_stamp_at: new Date().toISOString()
                };

                if (newStamps >= program.stamps_required) {
                    updateData.current_stamps = 0;
                    updateData.rewards_earned = cardData.rewards_earned + 1;
                    earnedTier = { reward_description: program.reward_description };
                }

                await supabase
                    .from('user_loyalty_cards')
                    .update(updateData)
                    .eq('id', cardData.id);
            }

            // Log usage
            await supabase.from('card_usage_logs').insert({
                card_type: 'LOYALTY',
                card_id: cardData.id,
                user_id: cardData.user_id,
                action: earnedTier ? 'REWARD_UNLOCKED' : 'STAMP_ADDED',
                stamps_remaining: earnedTier ? 0 : newStamps
            });

            // Notifications
            if (earnedTier) {
                await createNotification(cardData.user_id, {
                    type: NOTIFICATION_TYPES.REWARD_UNLOCKED,
                    title: '🏆 Premio Sbloccato!',
                    message: `Congratulazioni! Hai sbloccato: ${earnedTier.reward_description}`,
                    action_url: '/profile/cards'
                });

                await notify.rewardUnlocked({
                    userId: cardData.user_id,
                    email: cardData.profiles.email,
                    firstName: cardData.profiles.first_name || cardData.profiles.name,
                    programName: program.name,
                    reward: earnedTier.reward_description,
                    totalRewards: cardData.rewards_earned + 1
                });

                setActionResult({
                    success: true,
                    message: `🎉 PREMIO SBLOCCATO!\n${earnedTier.reward_description}\nRitira il premio alla reception!`
                });
            } else {
                await createNotification(cardData.user_id, {
                    type: NOTIFICATION_TYPES.STAMP_ADDED,
                    title: '⭐ Timbro Aggiunto',
                    message: `Hai raccolto ${newStamps} timbri!`,
                    action_url: '/profile/cards'
                });

                setActionResult({
                    success: true,
                    message: `Timbro aggiunto! (${newStamps}/${program.stamps_required})`
                });
            }

        } catch (error) {
            console.error('Error processing loyalty:', error);
            setError('Errore durante la registrazione.');
        } finally {
            setLoading(false);
        }
    };

    const resetScanner = () => {
        setScannerActive(true);
        setScanResult(null);
        setCardData(null);
        setCardType(null);
        setError(null);
        setActionResult(null);
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <h2 className="text-xl font-bold flex items-center">
                    <QrCode className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                    Scanner Ingressi Universale
                </h2>
                <p className="text-sm text-[var(--owner-text-muted)]">
                    Scansiona il QR Code delle carte Promo o Fedeltà
                </p>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {scannerActive && (
                    <div className="max-w-md mx-auto">
                        <div id="reader" className="rounded-xl overflow-hidden border-4 border-[var(--owner-border)]"></div>
                    </div>
                )}

                {!scannerActive && cardData && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        {/* Card Info */}
                        <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                            <div className="flex items-center gap-3 mb-4">
                                {cardType === 'PROMO' ? <CreditCard size={32} className="text-purple-500" /> : <Award size={32} className="text-amber-500" />}
                                <div>
                                    <h3 className="font-bold text-xl text-[var(--owner-text-primary)]">{cardData.profiles.name}</h3>
                                    <span className={`text-sm font-medium ${cardType === 'PROMO' ? 'text-purple-400' : 'text-amber-400'}`}>
                                        {cardType === 'PROMO' ? 'Carta Promo' : 'Carta Fedeltà'}
                                    </span>
                                </div>
                            </div>

                            {cardType === 'PROMO' && (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="bg-[var(--owner-bg-primary)] p-3 rounded-lg">
                                        <div className="text-[var(--owner-text-muted)]">Crediti Rimanenti</div>
                                        <div className="text-2xl font-bold text-[var(--owner-text-primary)]">{cardData.current_credits}</div>
                                    </div>
                                    <div className="bg-[var(--owner-bg-primary)] p-3 rounded-lg">
                                        <div className="text-[var(--owner-text-muted)]">Stato</div>
                                        <div className={`font-bold ${cardData.status === 'ACTIVE' ? 'text-green-500' : 'text-red-500'}`}>
                                            {cardData.status}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {cardType === 'LOYALTY' && (
                                <div className="space-y-3">
                                    <div className="bg-[var(--owner-bg-primary)] p-3 rounded-lg">
                                        <div className="text-[var(--owner-text-muted)] text-sm mb-2">Programma: {cardData.loyalty_programs.name}</div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-[var(--owner-bg-secondary)] rounded-full h-3 overflow-hidden">
                                                <div
                                                    className="h-full bg-amber-500 transition-all"
                                                    style={{ width: `${(cardData.current_stamps / cardData.loyalty_programs.stamps_required) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-[var(--owner-text-primary)]">
                                                {cardData.current_stamps}/{cardData.loyalty_programs.stamps_required}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-[var(--owner-text-muted)]">
                                        <Trophy size={14} className="inline mr-1" />
                                        Premi Ottenuti: <span className="font-bold text-[var(--owner-text-primary)]">{cardData.rewards_earned}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Action Result */}
                        {actionResult && (
                            <div className={`p-4 rounded-lg border-2 ${actionResult.success ? 'bg-green-500/10 border-green-500' : 'bg-red-500/10 border-red-500'}`}>
                                <div className="flex items-start gap-3">
                                    {actionResult.success ? <CheckCircle size={24} className="text-green-500 flex-shrink-0" /> : <XCircle size={24} className="text-red-500 flex-shrink-0" />}
                                    <p className={`font-medium whitespace-pre-line ${actionResult.success ? 'text-green-300' : 'text-red-300'}`}>
                                        {actionResult.message}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500 flex items-start gap-3">
                                <AlertCircle size={24} className="text-red-500 flex-shrink-0" />
                                <p className="text-red-300 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-3">
                            {!actionResult && (
                                <button
                                    onClick={cardType === 'PROMO' ? handlePromoAction : handleLoyaltyAction}
                                    disabled={loading || !!error}
                                    className="flex-1 bg-[var(--owner-accent)] text-white py-3 px-6 rounded-lg font-bold hover:bg-[var(--owner-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Elaborazione...' : cardType === 'PROMO' ? '✓ Scala Partita' : '✓ Aggiungi Timbro'}
                                </button>
                            )}
                            <button
                                onClick={resetScanner}
                                className="flex-1 bg-gray-700 text-white py-3 px-6 rounded-lg font-bold hover:bg-gray-600 transition-colors"
                            >
                                {actionResult ? 'Scansiona Altra Carta' : 'Annulla'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversalScanner;
