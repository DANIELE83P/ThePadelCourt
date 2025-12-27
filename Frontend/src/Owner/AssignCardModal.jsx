import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { X, CreditCard, Award, Check } from 'lucide-react';
import { notify } from '../utils/notification'; // Placeholder for future implementation

const AssignCardModal = ({ isOpen, onClose, user, onSuccess }) => {
    const { user: currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('promo'); // 'promo' | 'loyalty'
    const [loading, setLoading] = useState(false);

    // Data
    const [promoTemplates, setPromoTemplates] = useState([]);
    const [loyaltyPrograms, setLoyaltyPrograms] = useState([]);

    // Selection
    const [selectedPromo, setSelectedPromo] = useState(null);
    const [selectedLoyalty, setSelectedLoyalty] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchTemplates();
        }
    }, [isOpen]);

    const fetchTemplates = async () => {
        try {
            // Fetch Promo Cards Templates
            const { data: promos, error: promoError } = await supabase
                .from('promo_cards')
                .select('*')
                .eq('owner_id', currentUser.id);

            if (promoError) throw promoError;
            setPromoTemplates(promos || []);

            // Fetch Loyalty Programs
            const { data: loyalties, error: loyaltyError } = await supabase
                .from('loyalty_programs')
                .select('*')
                .eq('owner_id', currentUser.id)
                .eq('is_active', true);

            if (loyaltyError) throw loyaltyError;
            setLoyaltyPrograms(loyalties || []);

        } catch (error) {
            console.error("Error fetching templates:", error);
        }
    };

    const handleAssign = async () => {
        setLoading(true);
        try {
            let cardId;
            let cardType;

            if (activeTab === 'promo') {
                if (!selectedPromo) return;

                const { data, error } = await supabase
                    .from('user_promo_cards')
                    .insert({
                        user_id: user.id,
                        promo_card_id: selectedPromo.id,
                        name: selectedPromo.name,
                        total_credits: selectedPromo.credits,
                        remaining_credits: selectedPromo.credits,
                        status: 'ACTIVE'
                    })
                    .select()
                    .single();

                if (error) throw error;
                cardId = data.id;
                cardType = 'PROMO';

            } else {
                if (!selectedLoyalty) return;

                const { data, error } = await supabase
                    .from('user_loyalty_cards')
                    .insert({
                        user_id: user.id,
                        program_id: selectedLoyalty.id,
                        status: 'ACTIVE'
                    })
                    .select()
                    .single();

                if (error) throw error;
                cardId = data.id;
                cardType = 'LOYALTY';
            }

            // Log the action (Audit)
            /* 
            // Optional: Log assignment if card_usage_logs supports it. 
            // Currently it requires action to be DEDUCT/ADD etc, but we can add ASSIGNED if we want.
            // For now, let's keep it simple.
            */

            // Send Notification (Email) - Placeholder
            // notify.cardAssigned(user, cardType);

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error assigning card:", error);
            alert("Errore durante l'assegnazione della card.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-[var(--owner-card-bg)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--owner-border)] flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-[var(--owner-border)]">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--owner-text-primary)]">Assegna Card</h2>
                        <p className="text-sm text-[var(--owner-text-muted)]">A {user?.name}</p>
                    </div>
                    <button onClick={onClose} className="text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)] transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-2 border-b border-[var(--owner-border)] bg-[var(--owner-bg-secondary)]">
                    <button
                        onClick={() => setActiveTab('promo')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'promo'
                                ? 'bg-[var(--owner-bg-primary)] text-[var(--owner-accent)] shadow-sm border border-[var(--owner-border)]'
                                : 'text-[var(--owner-text-muted)] hover:text-[var(--owner-text-secondary)]'
                            }`}
                    >
                        <CreditCard size={18} />
                        Promo Card (Credits)
                    </button>
                    <button
                        onClick={() => setActiveTab('loyalty')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${activeTab === 'loyalty'
                                ? 'bg-[var(--owner-bg-primary)] text-[var(--owner-accent)] shadow-sm border border-[var(--owner-border)]'
                                : 'text-[var(--owner-text-muted)] hover:text-[var(--owner-text-secondary)]'
                            }`}
                    >
                        <Award size={18} />
                        Fidelity Card (Punti)
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {activeTab === 'promo' ? (
                        <div className="space-y-4">
                            {promoTemplates.length === 0 ? (
                                <p className="text-center text-[var(--owner-text-muted)] py-8">
                                    Nessun pacchetto promo disponibile. <br /> Crea prima un pacchetto in "Promo Settings".
                                </p>
                            ) : (
                                promoTemplates.map(promo => (
                                    <div
                                        key={promo.id}
                                        onClick={() => setSelectedPromo(promo)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedPromo?.id === promo.id
                                                ? 'border-[var(--owner-accent)] bg-[var(--owner-accent)]/10 ring-1 ring-[var(--owner-accent)]'
                                                : 'border-[var(--owner-border)] hover:border-[var(--owner-text-muted)] bg-[var(--owner-bg-primary)]'
                                            }`}
                                    >
                                        <div>
                                            <h3 className="font-bold text-[var(--owner-text-primary)]">{promo.name}</h3>
                                            <p className="text-sm text-[var(--owner-text-secondary)]">{promo.credits} Partite • €{promo.price}</p>
                                        </div>
                                        {selectedPromo?.id === promo.id && (
                                            <div className="w-6 h-6 rounded-full bg-[var(--owner-accent)] flex items-center justify-center">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {loyaltyPrograms.length === 0 ? (
                                <p className="text-center text-[var(--owner-text-muted)] py-8">
                                    Nessun programma fedeltà attivo. <br /> Configura un programma prima.
                                </p>
                            ) : (
                                loyaltyPrograms.map(prog => (
                                    <div
                                        key={prog.id}
                                        onClick={() => setSelectedLoyalty(prog)}
                                        className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedLoyalty?.id === prog.id
                                                ? 'border-[var(--owner-accent)] bg-[var(--owner-accent)]/10 ring-1 ring-[var(--owner-accent)]'
                                                : 'border-[var(--owner-border)] hover:border-[var(--owner-text-muted)] bg-[var(--owner-bg-primary)]'
                                            }`}
                                    >
                                        <div>
                                            <h3 className="font-bold text-[var(--owner-text-primary)]">{prog.name}</h3>
                                            <p className="text-sm text-[var(--owner-text-secondary)]">Target: {prog.stamps_required} Timbri</p>
                                            <p className="text-xs text-[var(--owner-text-muted)] mt-1">Premio: {prog.reward_description}</p>
                                        </div>
                                        {selectedLoyalty?.id === prog.id && (
                                            <div className="w-6 h-6 rounded-full bg-[var(--owner-accent)] flex items-center justify-center">
                                                <Check size={14} className="text-white" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-[var(--owner-border)]">
                    <button
                        onClick={handleAssign}
                        disabled={loading || (activeTab === 'promo' && !selectedPromo) || (activeTab === 'loyalty' && !selectedLoyalty)}
                        className="w-full bg-[var(--owner-accent)] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[var(--owner-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Assegnazione...' : 'Conferma Assegnazione'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssignCardModal;
