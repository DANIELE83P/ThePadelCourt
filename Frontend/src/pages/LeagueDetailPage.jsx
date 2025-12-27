import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, ChevronLeft, Users, Trophy, TrendingUp } from 'lucide-react';
import { leagueService } from '../services/leagueService';
import RegisterLeagueModal from '../components/Competition/RegisterLeagueModal';
import { useAuth } from '../Contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const LeagueDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();
    const [league, setLeague] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegModalOpen, setIsRegModalOpen] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await leagueService.getLeagueDetails(id);
                setLeague(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    if (loading) return (
        <div className="pt-24 min-h-screen bg-black flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!league) return <div className="pt-24 min-h-screen bg-black text-white text-center">Campionato non trovato</div>;

    return (
        <div className="pt-24 min-h-screen bg-black text-white pb-20">
            <div className="max-w-7xl mx-auto px-6">
                <button
                    onClick={() => navigate('/leagues')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group"
                >
                    <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                    Torna ai Campionati
                </button>

                <header className="mb-16">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">
                        <div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="bg-lime-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                    {league.status}
                                </span>
                                <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">GIRONE UNICO</span>
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
                                {league.name}
                            </h1>
                        </div>
                        <button
                            onClick={() => setIsRegModalOpen(true)}
                            className="bg-lime-500 hover:bg-lime-400 text-black font-black py-4 px-10 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs h-fit"
                        >
                            Iscriviti al Campionato
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Standings Table */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-4 mb-8">
                            <Trophy className="text-lime-500" />
                            <h2 className="text-3xl font-black uppercase tracking-tighter italic">Classifica <span className="text-lime-500">Ufficiale</span></h2>
                        </div>

                        <div className="bg-gray-900/30 border border-gray-800 rounded-[2.5rem] overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-900/50 border-b border-gray-800">
                                    <tr>
                                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Pos</th>
                                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Squadra</th>
                                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">{t('comp_played')}</th>
                                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">{t('comp_won')}</th>
                                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">{t('comp_lost')}</th>
                                        <th className="p-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center text-lime-500">{t('comp_points')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {league.standings?.map((team, idx) => (
                                        <motion.tr
                                            key={team.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-white/5 transition-colors group"
                                        >
                                            <td className="p-6">
                                                <span className={`text-xl font-black ${idx === 0 ? 'text-lime-500' : 'text-gray-700'}`}>
                                                    #{idx + 1}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div>
                                                    <p className="font-black uppercase italic text-white group-hover:text-lime-500 transition-colors">
                                                        {team.team_name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">
                                                        {team.player1_name} & {team.player2_name}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center font-bold text-gray-400">{team.matches_played}</td>
                                            <td className="p-6 text-center font-bold text-green-500/50">{team.wins}</td>
                                            <td className="p-6 text-center font-bold text-red-500/50">{team.losses}</td>
                                            <td className="p-6 text-center font-black text-2xl text-white">{team.points}</td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Sidebar / Stats */}
                    <div className="space-y-8">
                        <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Regolamento</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-gray-800">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Vittoria</span>
                                    <span className="text-xl font-black text-lime-500">+{league.points_win} PT</span>
                                </div>
                                <div className="flex justify-between items-center bg-black/40 p-4 rounded-2xl border border-gray-800">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Sconfitta</span>
                                    <span className="text-xl font-black text-gray-600">{league.points_loss} PT</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Matches Teaser */}
                        <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl">
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Ultimi Risultati</h3>
                            {league.matches?.filter(m => m.status === 'completed').length === 0 ? (
                                <p className="text-gray-600 text-xs font-bold uppercase text-center py-4">Nessun match completato</p>
                            ) : (
                                <div className="space-y-4">
                                    {league.matches?.filter(m => m.status === 'completed').slice(0, 3).map(match => (
                                        <div key={match.id} className="bg-black/40 p-4 rounded-2xl border border-gray-800 flex justify-between items-center">
                                            <span className="text-[10px] font-black uppercase text-gray-500">Match #{match.id.slice(0, 4)}</span>
                                            <span className="text-xs font-black text-lime-500">COMPLETATO</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {isRegModalOpen && (
                    <RegisterLeagueModal
                        isOpen={isRegModalOpen}
                        onClose={() => setIsRegModalOpen(false)}
                        league={league}
                        currentUser={user}
                        onRegistered={() => {
                            // Refresh logic
                            window.location.reload();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default LeagueDetailPage;
