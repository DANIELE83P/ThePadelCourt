import React, { useState, useEffect } from 'react';
import { X, Users, Shield, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { tournamentService } from '../../services/tournamentService';
import toast from 'react-hot-toast';

const RegisterTournamentModal = ({ isOpen, onClose, tournament, currentUser, onRegistered }) => {
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [players, setPlayers] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [teamName, setTeamName] = useState('');

    useEffect(() => {
        if (searchQuery.length > 2) {
            searchPlayers();
        } else {
            setPlayers([]);
        }
    }, [searchQuery]);

    const searchPlayers = async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, first_name, last_name, elo_rating, tier')
            .neq('id', currentUser.id)
            .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
            .limit(5);

        if (!error) setPlayers(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedPartner) {
            toast.error('Seleziona un compagno di squadra');
            return;
        }
        if (!teamName) {
            toast.error('Inserisci un nome per la squadra');
            return;
        }

        try {
            setLoading(true);
            await tournamentService.registerTeam(
                tournament.id,
                currentUser.id,
                selectedPartner.id,
                teamName
            );
            toast.success('Squadra iscritta al torneo!');
            onRegistered();
            onClose();
        } catch (error) {
            console.error('Error registering team:', error);
            toast.error('Errore durante l\'iscrizione');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-gray-900 w-full max-w-md rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl"
            >
                <div className="p-8 md:p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Forma la tua <span className="text-lime-500">Squadra</span></h2>
                            <p className="text-gray-500 text-xs font-bold uppercase mt-1">Pronto per la gloria nel torneo?</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Team Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Nome Squadra</label>
                            <input
                                type="text"
                                required
                                placeholder="E.g. I Guerrieri del Padel"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full bg-gray-800 border-2 border-transparent focus:border-lime-500 rounded-2xl p-4 text-white outline-none transition-all font-bold"
                            />
                        </div>

                        {/* Partner Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Cerca Partner</label>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    placeholder="Nome del compagno..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-gray-800 border-2 border-transparent focus:border-lime-500 rounded-2xl p-4 pl-12 text-white outline-none transition-all font-bold"
                                />
                            </div>

                            {selectedPartner ? (
                                <div className="mt-4 p-4 bg-lime-500/10 border border-lime-500/30 rounded-2xl flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-lime-500 text-black flex items-center justify-center font-black">
                                            {selectedPartner.first_name[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-white uppercase text-sm">{selectedPartner.first_name} {selectedPartner.last_name}</p>
                                            <p className="text-[10px] text-lime-500 font-bold uppercase">{selectedPartner.tier} • {selectedPartner.elo_rating} PTS</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPartner(null)}
                                        className="text-gray-500 hover:text-white"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2 mt-2">
                                    {players.map(player => (
                                        <button
                                            key={player.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedPartner(player);
                                                setSearchQuery('');
                                                setPlayers([]);
                                            }}
                                            className="w-full p-4 bg-gray-800/10 hover:bg-gray-800 border border-gray-800 rounded-2xl flex items-center gap-3 transition-all text-left"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-black">
                                                {player.first_name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white uppercase text-xs">{player.first_name} {player.last_name}</p>
                                                <p className="text-[10px] text-gray-500 font-bold uppercase">{player.tier} • {player.elo_rating} PTS</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedPartner || !teamName}
                            className="w-full bg-lime-500 hover:bg-lime-400 disabled:opacity-50 disabled:grayscale text-black font-black py-5 rounded-3xl transition-all shadow-xl shadow-lime-500/20 uppercase tracking-widest mt-4"
                        >
                            {loading ? 'Registrazione in corso...' : 'Conferma Iscrizione'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterTournamentModal;
