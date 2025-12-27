import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { QrCode, CheckCircle, XCircle, AlertCircle, CreditCard, Award } from "lucide-react";

const UniversalScanner = () => {
    const { user } = useAuth();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannerActive, setScannerActive] = useState(true);

    // Card Data
    const [cardData, setCardData] = useState(null);
    const [cardType, setCardType] = useState(null); // 'PROMO' | 'LOYALTY'

    const scannerRef = useRef(null);

    useEffect(() => {
        if (!scannerActive) return;

        // Initialize Scanner
        // Note: html5-qrcode attaches to an ID. We need to ensure the ID exists in DOM.
        const scannerId = "reader";

        // Wait a tick for DOM
        const timeout = setTimeout(() => {
            if (document.getElementById(scannerId)) {
                const scanner = new Html5QrcodeScanner(
                    scannerId,
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    /* verbose= */ false
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

    const onScanSuccess = async (decodedText, decodedResult) => {
        if (loading) return;

        // Pause scanning logic implicitly by setting state? 
        // Better to stop the scanner or just ignore efficiently.
        // Let's clear scanner temporarily to show result UI.
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
        // Just noise usually
    };

    const fetchCardData = async (code) => {
        setError(null);
        setCardData(null);
        setCardType(null);

        // 1. Try Promo Cards
        const { data: promo, error: promoError } = await supabase
            .from('user_promo_cards')
            .select('*, profiles:user_id(name)')
            .eq('card_code', code)
            .single();

        if (promo) {
            setCardType('PROMO');
            setCardData(promo);
            return;
        }

        // 2. Try Loyalty Cards
        const { data: loyalty, error: loyaltyError } = await supabase
            .from('user_loyalty_cards')
            .select('*, profiles:user_id(name), loyalty_programs(name, stamps_required, reward_description)')
            .eq('card_code', code)
            .single();

        if (loyalty) {
            setCardType('LOYALTY');
            setCardData(loyalty);
            return;
        }

        setError("Codice Card non trovato.");
    };

    const handleAction = async () => {
        if (!cardData || !cardType) return;
        setLoading(true);

        try {
            if (cardType === 'PROMO') {
                if (cardData.status !== 'ACTIVE') {
                    setError("Card non attiva.");
                    return;
                }
                if (cardData.remaining_credits <= 0) {
                    setError("Crediti esauriti.");
                    return;
                }

                // Deduct Credit
                const { error: updateError } = await supabase
                    .from('user_promo_cards')
                    .update({ remaining_credits: cardData.remaining_credits - 1 })
                    .eq('id', cardData.id);

                if (updateError) throw updateError;

                // Log
                await logUsage('PROMO', cardData.id, 'DEDUCT_CREDIT');

                alert("Ingresso Registrato! 1 Partita scalata.");
            } else {
                // Loyalty: Add Stamp
                // Check if suspended
                if (cardData.status !== 'ACTIVE') {
                    setError("Card sospesa.");
                    return;
                }

                const newStamps = cardData.current_stamps + 1;
                const target = cardData.loyalty_programs.stamps_required;
                let rewardMsg = "";
                let updates = { current_stamps: newStamps, last_stamp_at: new Date().toISOString() };

                if (newStamps >= target) {
                    updates.current_stamps = 0; // Reset or keep surplus? Usually reset.
                    updates.rewards_earned = (cardData.rewards_earned || 0) + 1;
                    rewardMsg = `\nTRAGUARDO RAGGIUNTO! ${cardData.loyalty_programs.reward_description}`;
                }

                const { error: updateError } = await supabase
                    .from('user_loyalty_cards')
                    .update(updates)
                    .eq('id', cardData.id);

                if (updateError) throw updateError;

                await logUsage('LOYALTY', cardData.id, 'ADD_STAMP');

                alert(`Timbro aggiunto!${rewardMsg}`);
            }

            // Reset for next scan
            resetScanner();

        } catch (err) {
            console.error(err);
            setError("Errore durante l'operazione.");
        } finally {
            setLoading(false);
        }
    };

    const logUsage = async (type, cardId, action) => {
        await supabase.from('card_usage_logs').insert({
            card_type: type,
            card_id: cardId,
            operator_id: user.id,
            action: action,
            amount: 1
        });
    };

    const resetScanner = () => {
        setScanResult(null);
        setCardData(null);
        setCardType(null);
        setError(null);
        setScannerActive(true);
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <h2 className="text-xl font-bold flex items-center">
                    <QrCode className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                    Scanner Ingressi
                </h2>
                <p className="text-sm text-[var(--owner-text-muted)]">
                    Scansiona QR Code per ingressi o raccolta punti.
                </p>
            </div>

            <div className="flex-1 overflow-auto p-6 flex flex-col items-center justify-center">

                {scannerActive && (
                    <div className="w-full max-w-md bg-[var(--owner-bg-primary)] p-4 rounded-xl border border-[var(--owner-border)]">
                        <div id="reader" className="w-full overflow-hidden rounded-lg"></div>
                    </div>
                )}

                {!scannerActive && cardData && (
                    <div className="w-full max-w-md bg-[var(--owner-bg-primary)] p-8 rounded-xl border border-[var(--owner-border)] text-center animate-in fade-in zoom-in-95">

                        {/* Icon */}
                        <div className="mx-auto w-20 h-20 rounded-full bg-[var(--owner-bg-secondary)] flex items-center justify-center mb-6 border-4 border-[var(--owner-bg-primary)] shadow-lg">
                            {cardType === 'PROMO' ? <CreditCard size={40} className="text-blue-400" /> : <Award size={40} className="text-yellow-400" />}
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold text-[var(--owner-text-primary)] mb-1">
                            {cardType === 'PROMO' ? cardData.name : cardData.loyalty_programs.name}
                        </h3>
                        <p className="text-[var(--owner-text-muted)] mb-6">
                            Intestatario: <span className="font-semibold text-[var(--owner-text-primary)]">{cardData.profiles?.name || 'Sconosciuto'}</span>
                        </p>

                        {/* Stats */}
                        <div className="bg-[var(--owner-bg-secondary)] rounded-lg p-4 mb-8">
                            {cardType === 'PROMO' ? (
                                <>
                                    <div className="text-sm text-[var(--owner-text-secondary)] uppercase">Crediti Residui</div>
                                    <div className={`text-3xl font-bold ${cardData.remaining_credits > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {cardData.remaining_credits} / {cardData.total_credits}
                                    </div>
                                    <div className="text-xs text-[var(--owner-text-muted)] mt-1">Stato: {cardData.status}</div>
                                </>
                            ) : (
                                <>
                                    <div className="text-sm text-[var(--owner-text-secondary)] uppercase">Punti Attuali</div>
                                    <div className="text-3xl font-bold text-yellow-500">
                                        {cardData.current_stamps} / {cardData.loyalty_programs.stamps_required}
                                    </div>
                                    <div className="text-xs text-[var(--owner-text-muted)] mt-1">Premi riscattati: {cardData.rewards_earned}</div>
                                </>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            {cardType === 'PROMO' && cardData.remaining_credits > 0 && (
                                <button onClick={handleAction} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95">
                                    Conferma Ingresso (Scala 1)
                                </button>
                            )}

                            {cardType === 'LOYALTY' && (
                                <button onClick={handleAction} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform hover:scale-105 active:scale-95">
                                    Aggiungi Timbro (+1)
                                </button>
                            )}

                            <button onClick={resetScanner} className="w-full bg-transparent border border-[var(--owner-border)] text-[var(--owner-text-secondary)] py-3 rounded-lg hover:bg-[var(--owner-bg-secondary)] mt-2">
                                Annulla / Nuova Scansione
                            </button>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {!scannerActive && error && (
                    <div className="w-full max-w-md bg-red-900/10 p-8 rounded-xl border border-red-500/30 text-center">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-red-400 mb-2">Errore Scansione</h3>
                        <p className="text-[var(--owner-text-muted)] mb-6">{error}</p>
                        <button onClick={resetScanner} className="bg-[var(--owner-bg-secondary)] text-[var(--owner-text-primary)] px-6 py-2 rounded-lg border border-[var(--owner-border)]">
                            Riprova
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};

export default UniversalScanner;
