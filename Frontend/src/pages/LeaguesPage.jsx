import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Calendar, Users, Star, Plus, Shield, Award, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { leagueService } from '../services/leagueService';
import { useAuth } from '../Contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';

const LeaguesPage = () => {
    const { t } = useTranslation();
    const { profile } = useAuth();
    const [leagues, setLeagues] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeagues = async () => {
        try {
            setLoading(true);
            const data = await leagueService.getLeagues();
            setLeagues(data);
        } catch (error) {
            console.error('Error fetching leagues:', error);
            toast.error('Impossibile caricare i campionati');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeagues();
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
                            {t('navbar_leagues').split(' ')[0]} <span className="text-lime-500">Arena</span>
                        </h1>
                        <p className="text-gray-500 font-bold mt-4 uppercase tracking-widest text-sm flex items-center gap-2">
                            <Shield size={16} className="text-lime-500" /> Sfida a Gironi
                        </p>
                    </div>

                    <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-lime-500 flex items-center justify-center text-black rotate-12">
                                <Award size={32} strokeWidth={2.5} />
                            </div>
                            <div className="absolute -top-2 -right-2 bg-white text-black text-[10px] font-black py-1 px-2 rounded-lg shadow-xl">
                                RANK {profile?.elo_rating || 1000}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Divisione</p>
                            <p className="text-2xl font-black text-white tracking-tight leading-none mt-1">
                                {profile?.tier || 'Bronze'} <span className="text-lime-500 text-sm ml-1 uppercase">League</span>
                            </p>
                        </div>
                    </div>
                </header>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[1, 2].map(i => (
                            <div key={i} className="aspect-[3/4] bg-gray-900/50 rounded-[2.5rem] animate-pulse"></div>
                        ))}
                    </div>
                ) : leagues.length === 0 ? (
                    <div className="py-20 text-center bg-gray-900/20 rounded-[3rem] border-2 border-dashed border-gray-900">
                        <Shield size={80} className="mx-auto text-gray-800 mb-6" />
                        <h2 className="text-3xl font-black text-gray-700 uppercase italic">Nessun Campionato Creato</h2>
                        <p className="text-gray-500 font-medium mt-2">Torna presto per le nuove iscrizioni.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {leagues.map((league) => (
                            <motion.div
                                key={league.id}
                                whileHover={{ y: -10 }}
                                className="group relative bg-gray-900 rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl"
                            >
                                <div className="h-48 bg-gradient-to-br from-indigo-900 to-black relative overflow-hidden p-8 flex items-end">
                                    <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                                        <Users size={160} />
                                    </div>
                                    <div className="relative z-10 w-full flex justify-between items-center">
                                        <span className="bg-lime-500/10 backdrop-blur-md text-lime-500 text-[10px] font-black px-4 py-2 rounded-full border border-lime-500/20 uppercase tracking-widest">
                                            {league.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-8">
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter group-hover:text-lime-500 transition-colors mb-2">
                                        {league.name}
                                    </h3>
                                    <p className="text-gray-400 text-sm font-medium flex items-center gap-2 mb-6">
                                        <Calendar size={14} className="text-lime-500" />
                                        {new Date(league.start_date).toLocaleDateString()}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-8">
                                        <div className="bg-black/30 p-4 rounded-2xl border border-gray-800 text-center">
                                            <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Squadre</p>
                                            <p className="text-lg font-black text-white">{league.teams?.length || 0}</p>
                                        </div>
                                        <div className="bg-black/30 p-4 rounded-2xl border border-gray-800 text-center">
                                            <p className="text-[10px] font-black text-gray-600 uppercase mb-1">Win PT</p>
                                            <p className="text-lg font-black text-lime-500">{league.points_win}</p>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/league/${league.id}`}
                                        className="block w-full text-center bg-white group-hover:bg-lime-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-xs"
                                    >
                                        {t('comp_standings')}
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeaguesPage;
