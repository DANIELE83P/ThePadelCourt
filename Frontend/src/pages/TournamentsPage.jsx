import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Calendar, Users, Star, Plus, Shield, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { tournamentService } from '../services/tournamentService';
import { useAuth } from '../Contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const TournamentsPage = () => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTournaments = async () => {
        try {
            setLoading(true);
            const data = await tournamentService.getTournaments();
            setTournaments(data);
        } catch (error) {
            console.error('Error fetching tournaments:', error);
            // toast.error('Impossibile caricare i tornei');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTournaments();
    }, []);

    return (
        <div className="pt-24 min-h-screen bg-black text-white p-6 pb-20">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-8">
                    <div className="relative">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            className="absolute -bottom-2 left-0 h-2 bg-lime-500 rounded-full"
                        />
                        <h1 className="text-6xl md:text-7xl font-black uppercase tracking-tighter italic leading-none">
                            Arena <span className="text-lime-500">Tornei</span>
                        </h1>
                        <p className="text-gray-500 font-bold mt-4 uppercase tracking-widest text-sm flex items-center gap-2">
                            <Trophy size={16} className="text-lime-500" /> Vivi la Leggenda
                        </p>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-lime-500 flex items-center justify-center text-black rotate-12 group-hover:rotate-0 transition-transform">
                                <Award size={32} strokeWidth={2.5} />
                            </div>
                            <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-black py-1 px-2 rounded-lg shadow-xl">
                                LVL {profile?.level || 1}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Il tuo Rango</p>
                            <p className="text-2xl font-black text-white tracking-tight leading-none mt-1">
                                {profile?.elo_rating || 1000} <span className="text-lime-500 text-sm ml-1 uppercase">{profile?.tier || 'Bronze'}</span>
                            </p>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="aspect-[3/4] bg-gray-900/50 rounded-[2.5rem] animate-pulse"></div>
                        ))}
                    </div>
                ) : tournaments.length === 0 ? (
                    <div className="py-20 text-center bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-900">
                        <Trophy size={80} className="mx-auto text-gray-800 mb-6" />
                        <h2 className="text-3xl font-black text-gray-700 uppercase italic">Nessun Torneo Attivo</h2>
                        <p className="text-gray-500 font-medium mt-2">Resta sintonizzato per le prossime convocazioni.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {tournaments.map((tournament) => (
                            <motion.div
                                key={tournament.id}
                                whileHover={{ y: -10 }}
                                className="group relative bg-gray-900 rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl"
                            >
                                {/* Tournament Hero Image/Pattern */}
                                <div className="h-48 bg-gradient-to-br from-lime-500 to-green-700 relative overflow-hidden p-8 flex items-end">
                                    <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Trophy size={160} />
                                    </div>
                                    <div className="relative z-10 w-full flex justify-between items-center">
                                        <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full border border-white/20 uppercase tracking-widest">
                                            {tournament.format.replace('_', ' ')}
                                        </span>
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(p => (
                                                <div key={p} className="w-8 h-8 rounded-full border-2 border-green-700 bg-gray-800 flex items-center justify-center text-[10px] font-bold">
                                                    U
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-lime-500 transition-colors">
                                                {tournament.name}
                                            </h3>
                                            <p className="text-gray-400 text-sm font-medium flex items-center gap-2 mt-1">
                                                <Calendar size={14} className="text-lime-500" />
                                                {new Date(tournament.start_date).toLocaleDateString('it-IT')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-black/30 p-4 rounded-2xl border border-gray-800">
                                            <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Squadre</p>
                                            <p className="text-lg font-black text-white leading-none">
                                                {tournament.teams?.[0]?.count || 0} / {tournament.max_teams}
                                            </p>
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-2xl border border-gray-800">
                                            <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Status</p>
                                            <p className={`text-lg font-black leading-none uppercase ${tournament.status === 'open' ? 'text-lime-500' : 'text-gray-500'}`}>
                                                {tournament.status}
                                            </p>
                                        </div>
                                    </div>

                                    <button className="w-full bg-white group-hover:bg-lime-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs">
                                        Vedi Tabellone
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Leaderboard Teaser */}
                <div className="mt-24 bg-gradient-to-r from-gray-900 to-black border border-gray-800 rounded-[3rem] p-12 overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-12 text-lime-500 opacity-5 group-hover:scale-110 transition-transform">
                        <Users size={300} />
                    </div>
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter italic mb-6">
                                Scala la <span className="text-lime-500">Hall of Fame</span>
                            </h2>
                            <p className="text-gray-400 text-lg font-medium mb-10 max-w-md">
                                Ogni vittoria ti porta più vicino allo status di <span className="text-white">Legend</span>.
                                Sfidati contro i migliori del club.
                            </p>
                            <button className="bg-gray-800 hover:bg-white hover:text-black text-white font-black py-4 px-10 rounded-2xl transition-all uppercase tracking-widest text-sm">
                                Vedi Classifica Globale
                            </button>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3].map((pos) => (
                                <div key={pos} className="flex items-center gap-6 bg-black/40 p-4 rounded-2xl border border-gray-800 hover:border-lime-500/50 transition-all">
                                    <span className={`text-3xl font-black ${pos === 1 ? 'text-lime-500' : 'text-gray-700'}`}>#0{pos}</span>
                                    <div className="w-12 h-12 rounded-xl bg-gray-800"></div>
                                    <div className="flex-1">
                                        <p className="font-bold text-white uppercase italic">Player Name</p>
                                        <p className="text-xs text-gray-500 font-black">2,450 PTS • PLATINUM</p>
                                    </div>
                                    <Shield size={20} className={pos === 1 ? 'text-lime-500' : 'text-gray-800'} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentsPage;
