import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, Calendar, Users, ChevronLeft, Shield, Award } from 'lucide-react';
import { tournamentService } from '../services/tournamentService';
import TournamentBracket from '../components/Competition/TournamentBracket';
import RegisterTournamentModal from '../components/Competition/RegisterTournamentModal';
import { useAuth } from '../Contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const TournamentDetailPage = () => {
    const { t } = useTranslation();
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

    const fetchDetails = async () => {
        try {
            const data = await tournamentService.getTournamentDetails(id);
            setTournament(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    if (loading) return <div className="pt-24 min-h-screen bg-black flex items-center justify-center"><div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin"></div></div>;

    return (
        <div className="pt-24 min-h-screen bg-black text-white pb-20">
            <div className="max-w-7xl mx-auto px-6">
                <button
                    onClick={() => navigate('/tournaments')}
                    className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-8 group"
                >
                    <ChevronLeft className="group-hover:-translate-x-1 transition-transform" />
                    Torna ai Tornei
                </button>

                <header className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-16">
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-4 mb-4">
                            <span className="bg-lime-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                                {tournament.status}
                            </span>
                            <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest">
                                {tournament.format}
                            </span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic mb-6">
                            {tournament.name}
                        </h1>
                        <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                            {tournament.description || 'Nessuna descrizione disponibile per questo torneo. Preparati alla sfida definitiva nell\'arena.'}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-gray-900 border border-gray-800 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform">
                                <Trophy size={100} />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Info Torneo</h3>
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-800 rounded-2xl text-lime-500"><Calendar size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Data Inizio</p>
                                        <p className="font-black text-lg">{new Date(tournament.start_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-gray-800 rounded-2xl text-lime-500"><Users size={20} /></div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-bold uppercase">Iscritti</p>
                                        <p className="font-black text-lg">{tournament.teams?.length || 0} / {tournament.max_teams} Squadre</p>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsRegisterModalOpen(true)}
                                className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black py-4 rounded-2xl transition-all shadow-xl mt-8 uppercase tracking-widest text-xs"
                            >
                                {t('comp_register_team')}
                            </button>
                        </div>
                    </div>
                </header>

                <div className="mb-20">
                    <div className="flex items-center gap-4 mb-10">
                        <Shield className="text-lime-500" />
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic">{t('comp_live_bracket').split(' ')[0]} <span className="text-lime-500">{t('comp_live_bracket').split(' ')[1]}</span></h2>
                    </div>

                    <div className="bg-gray-900/30 border border-gray-800 rounded-[3rem] overflow-hidden">
                        <TournamentBracket tournament={tournament} />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <section>
                        <h3 className="text-xl font-black uppercase tracking-tighter mb-8 flex items-center gap-3">
                            <Users className="text-lime-500" /> Squadre Partecipanti
                        </h3>
                        <div className="space-y-4">
                            {tournament.teams?.map((team, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-900/50 p-6 rounded-3xl border border-gray-800 hover:border-lime-500/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <span className="text-gray-700 font-black">#{idx + 1}</span>
                                        <div>
                                            <p className="font-black uppercase italic">{team.team_name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold">{team.player1?.first_name} & {team.player2?.first_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black text-lime-500 uppercase">SEED {team.seed || 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>

            <AnimatePresence>
                {isRegisterModalOpen && (
                    <RegisterTournamentModal
                        isOpen={isRegisterModalOpen}
                        onClose={() => setIsRegisterModalOpen(false)}
                        tournament={tournament}
                        currentUser={user}
                        onRegistered={fetchDetails}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default TournamentDetailPage;
