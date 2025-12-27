import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { CreditCard, Award, Calendar, TrendingUp, Clock, Trophy, CheckCircle, XCircle, Info } from 'lucide-react';

const UserCards = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'rules' | 'history'
    const [loading, setLoading] = useState(true);
    const [promoCards, setPromoCards] = useState([]);
    const [loyaltyCards, setLoyaltyCards] = useState([]);
    const [activities, setActivities] = useState([]);

    useEffect(() => {
        if (user) {
            fetchCards();
            if (activeTab === 'history') {
                fetchActivities();
            }
        }
    }, [user, activeTab]);

    const fetchCards = async () => {
        try {
            setLoading(true);

            // Fetch Promo Cards
            const { data: promos } = await supabase
                .from('user_promo_cards')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            setPromoCards(promos || []);

            // Fetch Loyalty Cards with tiers
            const { data: loyalties } = await supabase
                .from('user_loyalty_cards')
                .select(`
                    *,
                    loyalty_programs(
                        name,
                        stamps_required,
                        reward_description,
                        has_time_based_rewards,
                        rules_description
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            // For each loyalty card with time-based rewards, fetch tiers
            if (loyalties) {
                for (let card of loyalties) {
                    if (card.loyalty_programs.has_time_based_rewards) {
                        const { data: tiers } = await supabase
                            .from('loyalty_reward_tiers')
                            .select('*')
                            .eq('program_id', card.program_id)
                            .order('tier_level', { ascending: true });

                        card.tiers = tiers || [];
                    }
                }
            }

            setLoyaltyCards(loyalties || []);

        } catch (error) {
            console.error('Error fetching cards:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        try {
            const { data } = await supabase
                .from('user_card_activities')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            setActivities(data || []);
        } catch (error) {
            console.error('Error fetching activities:', error);
        }
    };

    const calculateDaysRemaining = (createdAt, timeLimitDays) => {
        const created = new Date(createdAt);
        const deadline = new Date(created.getTime() + timeLimitDays * 24 * 60 * 60 * 1000);
        const now = new Date();
        const remaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        return Math.max(0, remaining);
    };

    const getTierStatus = (card, tier) => {
        const activeTiers = JSON.parse(card.active_tiers || '[]');
        const expiredTiers = JSON.parse(card.expired_tiers || '[]');
        const tierKey = `tier_${tier.tier_level}`;

        if (activeTiers.includes(tierKey)) return 'unlocked';
        if (expiredTiers.includes(tierKey)) return 'expired';

        const daysRemaining = calculateDaysRemaining(card.created_at, tier.time_limit_days);
        if (daysRemaining === 0) return 'expired';
        if (card.current_stamps >= tier.stamps_required) return 'unlocked';

        return 'active';
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Le Mie Carte</h1>
                <p className="text-gray-600 dark:text-gray-400">Gestisci le tue carte promo e fedeltà</p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="flex space-x-8">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'overview'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Panoramica
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'rules'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Regolamento
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-4 text-sm font-medium transition-colors ${activeTab === 'history'
                                ? 'border-b-2 border-blue-600 text-blue-600'
                                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                            }`}
                    >
                        Storico
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    {/* Promo Cards */}
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                            <CreditCard className="text-purple-600" />
                            Carte Promo
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {promoCards.map(card => (
                                <div key={card.id} className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white shadow-lg">
                                    <h3 className="font-bold text-lg mb-2">{card.name}</h3>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm opacity-75">Partite rimanenti:</span>
                                        <span className="text-2xl font-bold">{card.current_credits}</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/20 text-xs opacity-75">
                                        Scade il: {new Date(card.expires_at).toLocaleDateString('it-IT')}
                                    </div>
                                </div>
                            ))}
                            {promoCards.length === 0 && (
                                <p className="text-gray-500 col-span-full text-center py-8">Nessuna carta promo attiva</p>
                            )}
                        </div>
                    </div>

                    {/* Loyalty Cards */}
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                            <Award className="text-amber-600" />
                            Carte Fedeltà
                        </h2>
                        <div className="space-y-4">
                            {loyaltyCards.map(card => (
                                <div key={card.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{card.loyalty_programs.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Premi ottenuti: {card.rewards_earned}</p>
                                        </div>
                                        <Trophy className="text-amber-500" size={32} />
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Progressi</span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {card.current_stamps}/{card.loyalty_programs.stamps_required}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                            <div
                                                className="bg-amber-500 h-3 rounded-full transition-all"
                                                style={{ width: `${(card.current_stamps / card.loyalty_programs.stamps_required) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Tiers (if time-based) */}
                                    {card.tiers && card.tiers.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Premi Disponibili:</p>
                                            <div className="space-y-2">
                                                {card.tiers.map(tier => {
                                                    const status = getTierStatus(card, tier);
                                                    const daysRemaining = calculateDaysRemaining(card.created_at, tier.time_limit_days);

                                                    return (
                                                        <div
                                                            key={tier.id}
                                                            className={`flex items-center justify-between p-3 rounded-lg border ${status === 'unlocked'
                                                                    ? 'bg-green-100 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                                                    : status === 'expired'
                                                                        ? 'bg-gray-100 dark:bg-gray-900/20 border-gray-300 dark:border-gray-700 opacity-50'
                                                                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                                                                }`}
                                                        >
                                                            <div className="flex-1">
                                                                <p className="font-medium text-sm text-gray-900 dark:text-white">{tier.reward_description}</p>
                                                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                    {tier.stamps_required} timbri in {tier.time_limit_days} giorni
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {status === 'unlocked' && <CheckCircle size={20} className="text-green-600" />}
                                                                {status === 'expired' && <XCircle size={20} className="text-gray-400" />}
                                                                {status === 'active' && (
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-bold text-blue-600">{daysRemaining}g</p>
                                                                        <Clock size={16} className="text-blue-600 mx-auto" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loyaltyCards.length === 0 && (
                                <p className="text-gray-500 text-center py-8">Nessuna carta fedeltà attiva</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'rules' && (
                <div className="space-y-6">
                    {loyaltyCards.map(card => (
                        <div key={card.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3 mb-4">
                                <Info className="text-blue-600 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{card.loyalty_programs.name}</h3>
                                    <div className="prose dark:prose-invert max-w-none">
                                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                            {card.loyalty_programs.rules_description || 'Nessun regolamento specificato.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {card.tiers && card.tiers.length > 0 && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Livelli Premio:</h4>
                                    <div className="space-y-3">
                                        {card.tiers.map(tier => (
                                            <div key={tier.id} className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                                <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">
                                                    {tier.tier_level}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">{tier.reward_description}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Raccogli {tier.stamps_required} timbri entro {tier.time_limit_days} giorni
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {loyaltyCards.length === 0 && (
                        <p className="text-gray-500 text-center py-8">Nessuna carta fedeltà attiva</p>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Storico Attività</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {activities.map(activity => (
                            <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{activity.action}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {activity.card_type} • {new Date(activity.created_at).toLocaleString('it-IT')}
                                        </p>
                                    </div>
                                    {activity.details && (
                                        <span className="text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                            {JSON.stringify(activity.details)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                        {activities.length === 0 && (
                            <p className="text-gray-500 text-center py-8">Nessuna attività registrata</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserCards;
