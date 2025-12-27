import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { BarChart, TrendingUp, Users, Award, Trophy } from 'lucide-react';

const AnalyticsDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeCards: 0,
        totalRewards: 0,
        completionRate: 0
    });
    const [tierStats, setTierStats] = useState([]);
    const [programStats, setProgramStats] = useState([]);

    useEffect(() => {
        if (user) fetchAnalytics();
    }, [user]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // 1. Total Users with Cards
            const { count: totalUsers } = await supabase
                .from('user_loyalty_cards')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ACTIVE');

            // 2. Total Rewards Unlocked
            const { data: rewardData } = await supabase
                .from('user_loyalty_cards')
                .select('rewards_earned')
                .eq('status', 'ACTIVE');

            const totalRewards = rewardData?.reduce((sum, card) => sum + (card.rewards_earned || 0), 0) || 0;

            // 3. Completion Rate
            const { data: allCards } = await supabase
                .from('user_loyalty_cards')
                .select('current_stamps, loyalty_programs(stamps_required)')
                .eq('status', 'ACTIVE');

            let completedCards = 0;
            allCards?.forEach(card => {
                if (card.current_stamps >= card.loyalty_programs.stamps_required) {
                    completedCards++;
                }
            });

            const completionRate = allCards?.length > 0
                ? Math.round((completedCards / allCards.length) * 100)
                : 0;

            // 4. Tier Stats (for time-based programs)
            const { data: tierData } = await supabase
                .from('loyalty_reward_tiers')
                .select(`
                    id,
                    tier_level,
                    reward_description,
                    program_id,
                    loyalty_programs(name)
                `);

            // Count unlocked tiers
            const { data: cardsWithTiers } = await supabase
                .from('user_loyalty_cards')
                .select('active_tiers, program_id')
                .eq('status', 'ACTIVE');

            const tierUnlockCounts = {};
            cardsWithTiers?.forEach(card => {
                const activeTiers = JSON.parse(card.active_tiers || '[]');
                activeTiers.forEach(tierKey => {
                    tierUnlockCounts[tierKey] = (tierUnlockCounts[tierKey] || 0) + 1;
                });
            });

            const enrichedTierStats = tierData?.map(tier => ({
                ...tier,
                unlockCount: tierUnlockCounts[`tier_${tier.tier_level}`] || 0
            })).sort((a, b) => b.unlockCount - a.unlockCount) || [];

            // 5. Program Stats
            const { data: programs } = await supabase
                .from('loyalty_programs')
                .select('id, name')
                .eq('is_active', true);

            const programStatsData = await Promise.all(
                programs?.map(async (program) => {
                    const { count } = await supabase
                        .from('user_loyalty_cards')
                        .select('*', { count: 'exact', head: true })
                        .eq('program_id', program.id)
                        .eq('status', 'ACTIVE');

                    return {
                        name: program.name,
                        activeUsers: count || 0
                    };
                }) || []
            );

            setStats({
                totalUsers: totalUsers || 0,
                activeCards: allCards?.length || 0,
                totalRewards,
                completionRate
            });

            setTierStats(enrichedTierStats);
            setProgramStats(programStatsData.sort((a, b) => b.activeUsers - a.activeUsers));

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="owner-section-card flex items-center justify-center h-full">
                <p className="text-[var(--owner-text-muted)]">Caricamento analytics...</p>
            </div>
        );
    }

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <BarChart className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                        Analytics Fedeltà
                    </h2>
                    <p className="text-sm text-[var(--owner-text-muted)]">
                        Statistiche e performance programmi fedeltà
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="text-blue-500" size={24} />
                            <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded">UTENTI</span>
                        </div>
                        <p className="text-3xl font-bold text-[var(--owner-text-primary)]">{stats.totalUsers}</p>
                        <p className="text-sm text-[var(--owner-text-muted)]">Carte Attive</p>
                    </div>

                    <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Trophy className="text-amber-500" size={24} />
                            <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">PREMI</span>
                        </div>
                        <p className="text-3xl font-bold text-[var(--owner-text-primary)]">{stats.totalRewards}</p>
                        <p className="text-sm text-[var(--owner-text-muted)]">Premi Sbloccati</p>
                    </div>

                    <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="text-green-500" size={24} />
                            <span className="text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded">TASSO</span>
                        </div>
                        <p className="text-3xl font-bold text-[var(--owner-text-primary)]">{stats.completionRate}%</p>
                        <p className="text-sm text-[var(--owner-text-muted)]">Completamento</p>
                    </div>

                    <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Award className="text-purple-500" size={24} />
                            <span className="text-xs font-bold text-purple-500 bg-purple-500/10 px-2 py-1 rounded">MEDIA</span>
                        </div>
                        <p className="text-3xl font-bold text-[var(--owner-text-primary)]">
                            {stats.totalUsers > 0 ? (stats.totalRewards / stats.totalUsers).toFixed(1) : '0.0'}
                        </p>
                        <p className="text-sm text-[var(--owner-text-muted)]">Premi/Utente</p>
                    </div>
                </div>

                {/* Tier Popularity */}
                <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 text-[var(--owner-text-primary)]">Tier Più Popolari</h3>
                    <div className="space-y-3">
                        {tierStats.slice(0, 5).map((tier, index) => (
                            <div key={tier.id} className="flex items-center gap-4">
                                <div className="flex-shrink-0 w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-[var(--owner-text-primary)] text-sm">{tier.reward_description}</p>
                                    <p className="text-xs text-[var(--owner-text-muted)]">{tier.loyalty_programs.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[var(--owner-text-primary)]">{tier.unlockCount}</p>
                                    <p className="text-xs text-[var(--owner-text-muted)]">sbloccati</p>
                                </div>
                                <div className="w-32">
                                    <div className="w-full bg-[var(--owner-bg-secondary)] rounded-full h-2">
                                        <div
                                            className="bg-amber-500 h-2 rounded-full"
                                            style={{ width: `${Math.min(100, (tier.unlockCount / stats.totalUsers) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {tierStats.length === 0 && (
                            <p className="text-[var(--owner-text-muted)] text-center py-4">Nessun tier configurato</p>
                        )}
                    </div>
                </div>

                {/* Program Stats */}
                <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                    <h3 className="font-bold text-lg mb-4 text-[var(--owner-text-primary)]">Programmi per Popolarità</h3>
                    <div className="space-y-3">
                        {programStats.map(program => (
                            <div key={program.name} className="flex items-center justify-between">
                                <p className="font-medium text-[var(--owner-text-primary)]">{program.name}</p>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-[var(--owner-text-muted)]">{program.activeUsers} utenti</span>
                                    <div className="w-32 bg-[var(--owner-bg-secondary)] rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${(program.activeUsers / stats.totalUsers) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {programStats.length === 0 && (
                            <p className="text-[var(--owner-text-muted)] text-center py-4">Nessun programma attivo</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
