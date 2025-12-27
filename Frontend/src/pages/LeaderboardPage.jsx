import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Shield, Star, Award, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LeaderboardPage = () => {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTier, setActiveTier] = useState('All');

    useEffect(() => {
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('elo_rating', { ascending: false })
                .limit(50);

            if (error) throw error;
            setPlayers(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const tiers = ['All', 'Platinum', 'Gold', 'Silver', 'Bronze'];
    const filteredPlayers = activeTier === 'All'
        ? players
        : players.filter(p => p.tier === activeTier);

    return (
        <div className="pt-24 min-h-screen bg-gray-950 text-white p-6 pb-20">
            <div className="max-w-5xl mx-auto">
                <header className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-block p-4 bg-lime-500/10 border border-lime-500/20 rounded-3xl mb-6"
                    >
                        <Trophy size={48} className="text-lime-500" />
                    </motion.div>
                    <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter italic italic">
                        Hall of <span className="text-lime-500">Fame</span>
                    </h1>
                    <p className="text-gray-500 mt-4 font-bold uppercase tracking-widest text-sm">
                        I migliori 50 guerrieri dell'arena
                    </p>
                </header>

                {/* Tier Filter */}
                <div className="flex flex-wrap justify-center gap-3 mb-12">
                    {tiers.map((tier) => (
                        <button
                            key={tier}
                            onClick={() => setActiveTier(tier)}
                            className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all border-2 ${activeTier === tier
                                    ? 'bg-lime-500 border-lime-500 text-black'
                                    : 'border-gray-800 text-gray-500 hover:border-gray-700 hover:text-white'
                                }`}
                        >
                            {tier}
                        </button>
                    ))}
                </div>

                {/* Top 3 Podium (Conceptual for desktop) */}
                <div className="hidden md:grid grid-cols-3 gap-8 mb-16 items-end">
                    {/* Rank 2 */}
                    {filteredPlayers[1] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2.5rem] pt-12 relative h-64 flex flex-col items-center"
                        >
                            <div className="absolute -top-8 w-16 h-16 rounded-2xl bg-gray-400 flex items-center justify-center text-black font-black text-2xl rotate-45">
                                <span className="-rotate-45">2</span>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 border-2 border-gray-400"></div>
                            <h3 className="font-black uppercase tracking-tight text-center truncate w-full">{filteredPlayers[1].first_name || 'Guerriero'}</h3>
                            <p className="text-lime-500 font-black">{filteredPlayers[1].elo_rating} PTS</p>
                        </motion.div>
                    )}
                    {/* Rank 1 */}
                    {filteredPlayers[0] && (
                        <motion.div
                            initial={{ y: -20, scale: 1.1, opacity: 0 }}
                            animate={{ y: 0, scale: 1.1, opacity: 1 }}
                            className="bg-gray-900 border-2 border-lime-500/50 p-8 rounded-[3rem] pt-16 relative h-80 flex flex-col items-center shadow-2xl shadow-lime-500/20"
                        >
                            <div className="absolute -top-10 w-20 h-20 rounded-[1.5rem] bg-lime-500 flex items-center justify-center text-black shadow-lg shadow-lime-500/40">
                                <Trophy size={40} />
                            </div>
                            <div className="w-20 h-20 rounded-full bg-gray-800 mb-6 border-4 border-lime-500"></div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-center truncate w-full">{filteredPlayers[0].first_name || 'Re dell\'Arena'}</h3>
                            <p className="text-3xl font-black text-lime-500">{filteredPlayers[0].elo_rating}</p>
                            <span className="text-[10px] font-black text-lime-500/50 uppercase tracking-[0.2em] mt-2">PLATINUM ELITE</span>
                        </motion.div>
                    )}
                    {/* Rank 3 */}
                    {filteredPlayers[2] && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-gray-900/50 border border-gray-800 p-8 rounded-[2.5rem] pt-12 relative h-56 flex flex-col items-center"
                        >
                            <div className="absolute -top-8 w-16 h-16 rounded-2xl bg-amber-700 flex items-center justify-center text-black font-black text-2xl rotate-45">
                                <span className="-rotate-45">3</span>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-gray-800 mb-4 border-2 border-amber-700"></div>
                            <h3 className="font-black uppercase tracking-tight text-center truncate w-full">{filteredPlayers[2].first_name || 'Guerriero'}</h3>
                            <p className="text-lime-500 font-black">{filteredPlayers[2].elo_rating} PTS</p>
                        </motion.div>
                    )}
                </div>

                {/* Player List */}
                <div className="bg-gray-900/30 rounded-[2.5rem] border border-gray-800 overflow-hidden">
                    <div className="p-8 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Giocatore</span>
                        <div className="flex gap-12">
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Tier</span>
                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">ELO</span>
                        </div>
                    </div>

                    <div className="divide-y divide-gray-800/50">
                        <AnimatePresence>
                            {filteredPlayers.map((player, index) => (
                                <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="p-6 md:p-8 flex justify-between items-center hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-6">
                                        <span className={`text-xl font-black w-8 ${index < 3 ? 'text-lime-500' : 'text-gray-700'}`}>
                                            #{String(index + 1).padStart(2, '0')}
                                        </span>
                                        <div className="w-12 h-12 rounded-xl bg-gray-800 flex items-center justify-center text-lg font-black uppercase text-gray-600 border border-gray-700 group-hover:border-lime-500/50 transition-colors">
                                            {(player.first_name || player.name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black uppercase italic tracking-tight text-white group-hover:text-lime-500 transition-colors">
                                                {player.first_name || player.name || 'Guerriero Anonimo'}
                                            </p>
                                            <p className="text-[10px] font-bold text-gray-600 flex items-center gap-2">
                                                <TrendingUp size={10} /> Level {player.level || 1} • {player.xp || 0} XP
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-12">
                                        <div className="hidden sm:block">
                                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-widest ${player.tier === 'Platinum' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                    player.tier === 'Gold' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                                                        player.tier === 'Silver' ? 'bg-gray-400/10 text-gray-400 border-gray-400/20' :
                                                            'bg-amber-700/10 text-amber-600 border-amber-700/20'
                                                }`}>
                                                {player.tier || 'Bronze'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white leading-none">{player.elo_rating || 1000}</p>
                                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Ranking PTS</span>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaderboardPage;
