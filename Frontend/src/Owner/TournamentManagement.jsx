import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Plus, Users, Calendar, Settings, Play, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const TournamentManagement = () => {
    const [tournaments, setTournaments] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTournament, setNewTournament] = useState({
        name: '',
        format: 'knockout',
        start_date: '',
        end_date: '',
        max_teams: 8
    });

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setTournaments(data);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('tournaments').insert([newTournament]);
        if (!error) {
            toast.success('Torneo creato!');
            setIsModalOpen(false);
            fetchTournaments();
        } else {
            toast.error('Errore nella creazione');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Trophy className="text-lime-500" /> Gestione Tornei
                </h1>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-lime-500 hover:bg-lime-600 text-black font-bold py-2 px-6 rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} /> Nuovo Torneo
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tournaments.map((t) => (
                    <div key={t.id} className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-lg">{t.name}</h3>
                            <span className="bg-lime-500/10 text-lime-500 text-[10px] font-bold px-2 py-1 rounded uppercase">
                                {t.status}
                            </span>
                        </div>
                        <div className="space-y-2 text-sm text-gray-400 mb-6">
                            <p className="flex items-center gap-2"><Calendar size={14} /> {t.start_date}</p>
                            <p className="flex items-center gap-2"><Users size={14} /> Max {t.max_teams} Squadre</p>
                            <p className="flex items-center gap-2"><Settings size={14} /> Formato: {t.format}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 bg-gray-700 hover:bg-gray-600 font-bold py-2 rounded-lg text-xs">Modifica</button>
                            <button className="bg-lime-500 hover:bg-lime-600 text-black font-bold p-2 rounded-lg">
                                <Play size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Simple Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl p-8">
                        <h2 className="text-xl font-bold mb-6">Nuovo Torneo</h2>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <input
                                className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700 text-white"
                                placeholder="Nome Torneo"
                                value={newTournament.name}
                                onChange={e => setNewTournament({ ...newTournament, name: e.target.value })}
                                required
                            />
                            <select
                                className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700 text-white"
                                value={newTournament.format}
                                onChange={e => setNewTournament({ ...newTournament, format: e.target.value })}
                            >
                                <option value="knockout">Knockout</option>
                                <option value="round_robin">Round Robin</option>
                                <option value="mixed">Mixed (Groups + KO)</option>
                            </select>
                            <input
                                type="date"
                                className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700 text-white"
                                value={newTournament.start_date}
                                onChange={e => setNewTournament({ ...newTournament, start_date: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                className="w-full bg-gray-800 p-3 rounded-lg border border-gray-700 text-white"
                                placeholder="Numero Max Squadre"
                                value={newTournament.max_teams}
                                onChange={e => setNewTournament({ ...newTournament, max_teams: parseInt(e.target.value) })}
                                required
                            />
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 text-gray-400 font-bold">Annulla</button>
                                <button type="submit" className="flex-1 bg-lime-500 text-black font-bold py-3 rounded-xl hover:bg-lime-600 transition-colors">Crea</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentManagement;
