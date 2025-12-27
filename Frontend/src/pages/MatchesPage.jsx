import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Users, Calendar, Plus, MapPin, Shield, Star, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { matchService } from '../services/matchService';
import { useAuth } from '../Contexts/AuthContext';
import toast, { Toaster } from 'react-hot-toast';
import CreateMatchModal from '../components/Competition/CreateMatchModal';
import MatchResultModal from '../components/Competition/MatchResultModal';

const MatchesPage = () => {
    const { t } = useTranslation();
    const { user, profile } = useAuth();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isResultModalOpen, setIsResultModalOpen] = useState(false);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'mine'

    const fetchMatches = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('matches')
                .select(`
                    *,
                    creator:profiles!matches_creator_id_fkey(id, name, first_name, last_name),
                    court:courts(id, name, location),
                    players:match_players(
                        id,
                        user_id,
                        team,
                        slot,
                        user:profiles(id, name, first_name, last_name, elo_rating, tier)
                    )
                `)
                .neq('status', 'completed')
                .order('match_date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;

            let filteredData = data;
            if (filter === 'mine') {
                filteredData = data.filter(m => m.players?.some(p => p.user_id === user?.id));
            } else if (filter === 'all') {
                filteredData = data.filter(m => m.status === 'open');
            }

            setMatches(filteredData);
        } catch (error) {
            console.error('Error fetching matches:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMatches();
    }, []);

    const handleJoin = async (matchId) => {
        try {
            const match = matches.find(m => m.id === matchId);
            const existingSlots = match.players.map(p => p.slot);
            let targetSlot = [1, 2, 3, 4].find(s => !existingSlots.includes(s));
            let targetTeam = targetSlot <= 2 ? 1 : 2;

            await matchService.joinMatch(matchId, user.id, targetTeam, targetSlot);
            toast.success('Ti sei unito alla partita!');
            fetchMatches();
        } catch (error) {
            console.error('Error joining match:', error);
            toast.error('Impossibile unirsi alla partita');
        }
    };

    const handleLeave = async (matchId) => {
        try {
            await matchService.leaveMatch(matchId, user.id);
            toast.success('Hai lasciato la partita');
            fetchMatches();
        } catch (error) {
            console.error('Error leaving match:', error);
            toast.error('Errore durante l\'uscita dalla partita');
        }
    };

    const handleOpenResultModal = (match) => {
        setSelectedMatch(match);
        setIsResultModalOpen(true);
    };

    return (
        <div className="pt-24 min-h-screen bg-gray-950 text-white p-6 pb-20">
            <Toaster position="top-right" />
            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="bg-lime-500/10 text-lime-500 text-xs font-black px-3 py-1 rounded-full border border-lime-500/20 uppercase tracking-widest">
                                Match Center
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">
                            Partite <span className="text-lime-500">{filter === 'mine' ? 'Mie' : 'Aperte'}</span>
                        </h1>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                        <div className="bg-gray-900 p-1.5 rounded-2xl border border-gray-800 flex gap-1">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-lime-500 text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                Tutte
                            </button>
                            <button
                                onClick={() => setFilter('mine')}
                                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === 'mine' ? 'bg-lime-500 text-black' : 'text-gray-500 hover:text-white'}`}
                            >
                                Mie Partite
                            </button>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="group bg-lime-500 hover:bg-lime-400 text-black font-black py-4 px-8 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-xl shadow-lime-500/20"
                        >
                            <Plus size={24} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
                            Crea Sfida
                        </button>
                    </div>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 grayscale opacity-50">
                        <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-bold tracking-widest uppercase text-xs">Caricamento Arena...</p>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="bg-gray-900/50 border-2 border-dashed border-gray-800 rounded-[2rem] p-12 text-center">
                        <Users size={64} className="mx-auto mb-6 text-gray-700" />
                        <h2 className="text-2xl font-bold mb-2">Nessuna partita disponibile</h2>
                        <p className="text-gray-500 mb-8">Sii il primo ad inaugurare il campo oggi!</p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-lime-500 font-bold hover:underline"
                        >
                            Crea la tua prima partita ora &rarr;
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence>
                            {matches.map((match) => (
                                <motion.div
                                    key={match.id}
                                    layout
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="relative bg-gray-900 rounded-[2rem] border border-gray-800 overflow-hidden hover:border-lime-500/30 transition-all group shadow-2xl"
                                >
                                    {/* Card Header */}
                                    <div className="p-8 pb-0">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-lime-500 animate-pulse"></div>
                                                <span className="text-xs font-black uppercase tracking-widest text-lime-500">
                                                    {match.type === 'ranked' ? '🏆 Classificata' : '🤝 Amichevole'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm font-bold">
                                                <Calendar size={16} />
                                                {new Date(match.match_date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                                                <span className="text-gray-700 mx-1">|</span>
                                                {match.start_time.substring(0, 5)}
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">
                                            {match.court?.name || 'Campo Generico'}
                                        </h3>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-8">
                                            <MapPin size={14} className="text-lime-500" />
                                            {match.court?.location || 'Posizione non specificata'}
                                        </div>
                                    </div>

                                    {/* Players Grid */}
                                    <div className="px-8 mb-8">
                                        <div className="grid grid-cols-2 gap-4">
                                            {[1, 2, 3, 4].map((slot) => {
                                                const player = match.players?.find(p => p.slot === slot);
                                                return (
                                                    <div
                                                        key={slot}
                                                        className={`group/slot relative aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-all border-2 ${player
                                                            ? 'bg-gray-800 border-transparent'
                                                            : 'bg-transparent border-gray-800 border-dashed hover:border-lime-500/50 cursor-pointer'
                                                            }`}
                                                    >
                                                        {player ? (
                                                            <>
                                                                <div className="w-12 h-12 rounded-full bg-lime-500 text-black flex items-center justify-center font-black text-lg">
                                                                    {(player.user?.first_name || 'U').charAt(0)}
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-tighter text-gray-400 truncate w-full text-center px-2">
                                                                    {player.user?.first_name || 'Giocatore'}
                                                                </span>
                                                                <div className="absolute top-2 right-2 flex gap-1">
                                                                    <Star size={10} className="text-lime-500 fill-current" />
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <div className="w-10 h-10 rounded-full border-2 border-gray-800 border-dashed flex items-center justify-center group-hover/slot:border-lime-500 transition-colors">
                                                                    <Plus size={20} className="text-gray-700 group-hover/slot:text-lime-500" />
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase text-gray-600 group-hover/slot:text-lime-500 transition-colors">
                                                                    Libero
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="p-8 pt-0 mt-auto">
                                        {match.status === 'full' && match.players?.some(p => p.user_id === user?.id) ? (
                                            <button
                                                onClick={() => handleOpenResultModal(match)}
                                                className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                            >
                                                <Trophy size={16} />
                                                Invia Risultato
                                            </button>
                                        ) : match.players?.some(p => p.user_id === user?.id) ? (
                                            <button
                                                onClick={() => handleLeave(match.id)}
                                                className="w-full bg-gray-800 hover:bg-red-500/20 hover:text-red-500 text-gray-400 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                            >
                                                <LogOut size={16} />
                                                Lascia Partita
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleJoin(match.id)}
                                                disabled={match.players?.length >= 4}
                                                className="w-full bg-lime-500 hover:bg-lime-400 disabled:bg-gray-800 disabled:text-gray-600 text-black font-black py-4 rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                                            >
                                                {match.players?.length >= 4 ? 'Partita Piena' : 'Partecipa Ora'}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <CreateMatchModal
                        isOpen={isModalOpen}
                        onClose={() => setIsModalOpen(false)}
                        user={user}
                        onCreated={fetchMatches}
                    />
                )}
                {isResultModalOpen && (
                    <MatchResultModal
                        isOpen={isResultModalOpen}
                        onClose={() => {
                            setIsResultModalOpen(false);
                            setSelectedMatch(null);
                        }}
                        match={selectedMatch}
                        onSubmitted={fetchMatches}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

export default MatchesPage;
