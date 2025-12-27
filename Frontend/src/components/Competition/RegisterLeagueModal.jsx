import React, { useState, useEffect } from 'react';
import { X, Trophy, Search, UserPlus, Users, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { leagueService } from '../../services/leagueService';
import toast from 'react-hot-toast';

const RegisterLeagueModal = ({ isOpen, onClose, league, currentUser, onRegistered }) => {
    const [teamName, setTeamName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [partners, setPartners] = useState([]);
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (searchQuery.length > 2) {
            const timer = setTimeout(searchPlayers, 500);
            return () => clearTimeout(timer);
        } else {
            setPartners([]);
        }
    }, [searchQuery]);

    const searchPlayers = async () => {
        try {
            setSearching(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, first_name, last_name, name, elo_rating')
                .neq('id', currentUser.id)
                .or(`name.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
                .limit(5);

            if (error) throw error;
            setPartners(data);
        } catch (error) {
            console.error('Error searching players:', error);
        } finally {
            setSearching(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!selectedPartner || !teamName) return;

        try {
            setLoading(true);
            await leagueService.registerLeagueTeam(
                league.id,
                currentUser.id,
                selectedPartner.id,
                teamName
            );
            toast.success('Iscrizione completata! Benvenuti nel girone.');
            onRegistered();
            onClose();
        } catch (error) {
            console.error('Registration error:', error);
            toast.error('Errore durante l\'iscrizione. Verifica se sei già iscritto.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative bg-gray-950 border border-gray-800 w-full max-w-xl rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(190,242,100,0.15)]"
            >
                <div className="p-8 md:p-12">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <span className="bg-lime-500/10 text-lime-500 text-[10px] font-black px-3 py-1 rounded-full border border-lime-500/20 uppercase tracking-widest mb-4 inline-block">
                                ISCRIZIONE GIRONE
                            </span>
                            <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                                Forma la tua <span className="text-lime-500">Squadra</span>
                            </h2>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-900 rounded-2xl text-gray-500 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-8">
                        {/* Team Name */}
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4 mb-2 block">
                                Nome della Squadra
                            </label>
                            <input
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="E.g. I Gladiatori del Padel"
                                className="w-full bg-gray-900 border-2 border-transparent focus:border-lime-500 rounded-3xl p-6 text-xl font-black outline-none transition-all placeholder:text-gray-700"
                            />
                        </div>

                        {/* Partner Selection */}
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4 mb-2 block">
                                Seleziona il tuo Partner
                            </label>

                            {selectedPartner ? (
                                <div className="bg-lime-500/10 border-2 border-lime-500/50 p-6 rounded-3xl flex justify-between items-center animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-lime-500 flex items-center justify-center text-black">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <p className="font-black uppercase italic text-white">{selectedPartner.first_name || selectedPartner.name}</p>
                                            <p className="text-[10px] font-bold text-lime-500 uppercase">ELO: {selectedPartner.elo_rating}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPartner(null)}
                                        className="text-gray-500 hover:text-red-500 font-bold uppercase text-[10px] tracking-widest"
                                    >
                                        Rimuovi
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Cerca per nome o email..."
                                        className="w-full bg-gray-900 border-2 border-transparent focus:border-lime-500 rounded-3xl p-6 pl-14 text-xl font-black outline-none transition-all placeholder:text-gray-700"
                                    />
                                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700" />

                                    {/* Search Results */}
                                    <AnimatePresence>
                                        {partners.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute top-full left-0 right-0 mt-4 bg-gray-900 border border-gray-800 rounded-[2rem] overflow-hidden z-20 shadow-2xl"
                                            >
                                                {partners.map(p => (
                                                    <button
                                                        key={p.id}
                                                        type="button"
                                                        onClick={() => setSelectedPartner(p)}
                                                        className="w-full p-6 flex items-center gap-4 hover:bg-lime-500/10 transition-colors text-left border-b border-gray-800 last:border-0"
                                                    >
                                                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-lime-500">
                                                            <UserPlus size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black uppercase italic text-white text-sm">{p.first_name || p.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-600 uppercase">ELO: {p.elo_rating}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !selectedPartner || !teamName}
                            className="w-full bg-lime-500 hover:bg-lime-400 disabled:bg-gray-800 disabled:text-gray-700 text-black font-black py-6 rounded-[2rem] transition-all shadow-xl shadow-lime-500/20 uppercase tracking-widest text-sm flex items-center justify-center gap-3"
                        >
                            {loading ? 'Elaborazione...' : 'Conferma Iscrizione Squadra'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterLeagueModal;
