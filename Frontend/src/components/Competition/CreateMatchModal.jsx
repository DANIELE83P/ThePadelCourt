import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Trophy, Users, Shield, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { matchService } from '../services/matchService';
import toast from 'react-hot-toast';

const CreateMatchModal = ({ isOpen, onClose, user, onCreated }) => {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        court_id: '',
        match_date: new Date().toISOString().split('T')[0],
        start_time: '18:00',
        type: 'casual',
        min_elo: 0,
        max_elo: 3000
    });

    useEffect(() => {
        if (isOpen) {
            fetchCourts();
        }
    }, [isOpen]);

    const fetchCourts = async () => {
        const { data, error } = await supabase.from('courts').select('id, name, location');
        if (!error) setCourts(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.court_id) {
            toast.error('Seleziona un campo');
            return;
        }

        try {
            setLoading(true);
            const endTime = calculateEndTime(formData.start_time);

            await matchService.createMatch({
                ...formData,
                end_time: endTime,
                creator_id: user.id
            });

            toast.success('Sfida lanciata nell\'arena!');
            onCreated();
            onClose();
        } catch (error) {
            console.error('Error creating match:', error);
            toast.error('Errore durante la creazione della partita');
        } finally {
            setLoading(false);
        }
    };

    const calculateEndTime = (startTime) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const endHours = (hours + 1) % 24;
        return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-gray-900 w-full max-w-xl rounded-[2.5rem] border border-gray-800 overflow-hidden shadow-2xl"
            >
                <div className="p-8 md:p-12">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">Lancia una <span className="text-lime-500 underline decoration-4 underline-offset-4">Sfida</span></h2>
                            <p className="text-gray-500 text-sm mt-2 font-medium">Definisci le regole del campo.</p>
                        </div>
                        <button onClick={onClose} className="p-3 bg-gray-800 rounded-2xl text-gray-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Court Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Seleziona Arena</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {courts.map((court) => (
                                    <div
                                        key={court.id}
                                        onClick={() => setFormData({ ...formData, court_id: court.id })}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${formData.court_id === court.id
                                                ? 'border-lime-500 bg-lime-500/5'
                                                : 'border-gray-800 bg-gray-800/50 hover:border-gray-700'
                                            }`}
                                    >
                                        <div className={`p-2 rounded-xl ${formData.court_id === court.id ? 'bg-lime-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                            <Zap size={16} />
                                        </div>
                                        <div className="text-left">
                                            <p className={`font-bold text-sm ${formData.court_id === court.id ? 'text-white' : 'text-gray-400'}`}>
                                                {court.name}
                                            </p>
                                            <p className="text-[10px] text-gray-600 font-bold uppercase">{court.location}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            {/* Date */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                    <Calendar size={12} /> Data
                                </label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={formData.match_date}
                                    onChange={(e) => setFormData({ ...formData, match_date: e.target.value })}
                                    className="w-full bg-gray-800 border-2 border-transparent focus:border-lime-500 rounded-2xl p-4 text-white outline-none transition-all font-bold"
                                />
                            </div>

                            {/* Time */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex items-center gap-2">
                                    <Clock size={12} /> Ora Inizio
                                </label>
                                <input
                                    type="time"
                                    required
                                    value={formData.start_time}
                                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                    className="w-full bg-gray-800 border-2 border-transparent focus:border-lime-500 rounded-2xl p-4 text-white outline-none transition-all font-bold"
                                    step="1800"
                                />
                            </div>
                        </div>

                        {/* Match Type */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Tipo di Partita</label>
                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'casual' })}
                                    className={`flex-1 p-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-bold transition-all ${formData.type === 'casual'
                                            ? 'border-lime-500 bg-lime-500/10 text-lime-500'
                                            : 'border-gray-800 text-gray-500'
                                        }`}
                                >
                                    <Users size={18} /> Amichevole
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: 'ranked' })}
                                    className={`flex-1 p-4 rounded-2xl border-2 flex items-center justify-center gap-3 font-bold transition-all ${formData.type === 'ranked'
                                            ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500'
                                            : 'border-gray-800 text-gray-500'
                                        }`}
                                >
                                    <Trophy size={18} /> Classificata
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-white hover:bg-lime-500 text-black font-black py-5 rounded-3xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 mt-4 uppercase tracking-widest"
                        >
                            {loading ? 'Preparazione Arena...' : 'Lancia Sfida Ora'}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default CreateMatchModal;
