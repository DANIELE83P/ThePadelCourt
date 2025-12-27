import React, { useState } from 'react';
import { X, Trophy, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const MatchResultModal = ({ isOpen, onClose, match, onSubmitted }) => {
    const [loading, setLoading] = useState(false);
    const [scores, setScores] = useState({
        t1_s1: 6, t2_s1: 0,
        t1_s2: 6, t2_s2: 0,
        t1_s3: 0, t2_s3: 0
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Simple logic to determine winner
        let t1_sets = 0;
        let t2_sets = 0;

        if (scores.t1_s1 > scores.t2_s1) t1_sets++; else t2_sets++;
        if (scores.t1_s2 > scores.t2_s2) t1_sets++; else t2_sets++;
        if (scores.t1_s3 || scores.t2_s3) {
            if (scores.t1_s3 > scores.t2_s3) t1_sets++; else t2_sets++;
        }

        const winner = t1_sets > t2_sets ? 1 : 2;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('match_results')
                .insert([{
                    match_id: match.id,
                    team1_score1: scores.t1_s1,
                    team1_score2: scores.t1_s2,
                    team1_score3: scores.t1_s3,
                    team2_score1: scores.t2_s1,
                    team2_score2: scores.t2_s2,
                    team2_score3: scores.t2_s3,
                    winner_team: winner
                }]);

            if (error) throw error;

            toast.success('Risultato inviato! Ranking aggiornato.');
            onSubmitted();
            onClose();
        } catch (error) {
            console.error('Error reporting result:', error);
            toast.error('Errore nell\'invio del risultato');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-gray-900 border border-gray-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden"
            >
                <div className="p-8 md:p-10">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                                Inserisci <span className="text-lime-500">Risultato</span>
                            </h2>
                            <p className="text-gray-500 text-xs font-bold uppercase mt-1">Conferma l'esito della battaglia</p>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="bg-black/40 rounded-3xl p-6 border border-gray-800">
                            <div className="grid grid-cols-4 gap-4 items-center mb-6">
                                <div className="col-span-1 text-[10px] font-black uppercase text-gray-500">TEAM</div>
                                <div className="text-center text-[10px] font-black text-gray-500">SET 1</div>
                                <div className="text-center text-[10px] font-black text-gray-500">SET 2</div>
                                <div className="text-center text-[10px] font-black text-gray-500">SET 3</div>
                            </div>

                            {/* Team 1 Row */}
                            <div className="grid grid-cols-4 gap-4 items-center mb-4">
                                <div className="text-sm font-black text-lime-500">TEAM 1</div>
                                <input
                                    type="number"
                                    value={scores.t1_s1}
                                    onChange={(e) => setScores({ ...scores, t1_s1: parseInt(e.target.value) })}
                                    className="bg-gray-800 border-2 border-transparent focus:border-lime-500 rounded-xl p-3 text-center text-xl font-black outline-none"
                                />
                                <input
                                    type="number"
                                    value={scores.t1_s2}
                                    onChange={(e) => setScores({ ...scores, t1_s2: parseInt(e.target.value) })}
                                    className="bg-gray-800 border-2 border-transparent focus:border-lime-500 rounded-xl p-3 text-center text-xl font-black outline-none"
                                />
                                <input
                                    type="number"
                                    value={scores.t1_s3}
                                    onChange={(e) => setScores({ ...scores, t1_s3: parseInt(e.target.value) })}
                                    className="bg-gray-800 border-2 border-transparent focus:border-lime-500 rounded-xl p-3 text-center text-xl font-black outline-none"
                                />
                            </div>

                            {/* Team 2 Row */}
                            <div className="grid grid-cols-4 gap-4 items-center">
                                <div className="text-sm font-black text-blue-500">TEAM 2</div>
                                <input
                                    type="number"
                                    value={scores.t2_s1}
                                    onChange={(e) => setScores({ ...scores, t2_s1: parseInt(e.target.value) })}
                                    className="bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3 text-center text-xl font-black outline-none"
                                />
                                <input
                                    type="number"
                                    value={scores.t2_s2}
                                    onChange={(e) => setScores({ ...scores, t2_s2: parseInt(e.target.value) })}
                                    className="bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3 text-center text-xl font-black outline-none"
                                />
                                <input
                                    type="number"
                                    value={scores.t2_s3}
                                    onChange={(e) => setScores({ ...scores, t2_s3: parseInt(e.target.value) })}
                                    className="bg-gray-800 border-2 border-transparent focus:border-blue-500 rounded-xl p-3 text-center text-xl font-black outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                            <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                            <p className="text-[10px] text-amber-200/70 font-bold leading-relaxed">
                                ATTENZIONE: Una volta confermato, il risultato aggiornerà automaticamente l'ELO e gli XP di tutti i partecipanti. Assicurati che il punteggio sia corretto.
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-lime-500 hover:bg-lime-400 text-black font-black py-5 rounded-3xl transition-all shadow-xl shadow-lime-500/20 uppercase tracking-widest"
                        >
                            {loading ? 'Elaborazione Dati...' : 'Conferma Risultato Match'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default MatchResultModal;
