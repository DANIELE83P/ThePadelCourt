import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { Award, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

const LoyaltySettings = () => {
    const { user } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        stamps_required: 10,
        reward_description: ""
    });

    useEffect(() => {
        if (user) fetchPrograms();
    }, [user]);

    const fetchPrograms = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('loyalty_programs')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPrograms(data || []);
        } catch (error) {
            console.error("Error fetching programs:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('loyalty_programs')
                .insert({
                    owner_id: user.id,
                    ...formData,
                    is_active: true
                })
                .select()
                .single();

            if (error) throw error;

            setPrograms([data, ...programs]);
            setShowForm(false);
            setFormData({ name: "", stamps_required: 10, reward_description: "" });
        } catch (error) {
            console.error("Error creating program:", error);
            alert("Errore nella creazione del programma.");
        }
    };

    const toggleStatus = async (programId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('loyalty_programs')
                .update({ is_active: !currentStatus })
                .eq('id', programId);

            if (error) throw error;
            setPrograms(programs.map(p => p.id === programId ? { ...p, is_active: !currentStatus } : p));
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <Award className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                        Programmi Fedeltà
                    </h2>
                    <p className="text-sm text-[var(--owner-text-muted)]">
                        Configura le regole per la raccolta punti (Timbri).
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-[var(--owner-accent)] text-white px-4 py-2 rounded-lg hover:bg-[var(--owner-accent-hover)] transition-colors text-sm font-bold"
                >
                    <Plus size={16} />
                    {showForm ? "Annulla" : "Nuovo Programma"}
                </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {showForm && (
                    <form onSubmit={handleSubmit} className="mb-8 bg-[var(--owner-bg-secondary)] p-6 rounded-xl border border-[var(--owner-border)] animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Nome Programma</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="es. Fidelity 2025"
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Timbri Richiesti</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    max="100"
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    value={formData.stamps_required}
                                    onChange={e => setFormData({ ...formData, stamps_required: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Premio</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="es. 1 Partita Gratis"
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    value={formData.reward_description}
                                    onChange={e => setFormData({ ...formData, reward_description: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button type="submit" className="bg-[var(--owner-accent)] text-white px-6 py-2 rounded-lg font-bold hover:bg-[var(--owner-accent-hover)] transition-colors">
                                Crea Programma
                            </button>
                        </div>
                    </form>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {programs.map(prog => (
                        <div key={prog.id} className={`p-6 rounded-xl border ${prog.is_active ? 'border-[var(--owner-border)] bg-[var(--owner-card-bg)]' : 'border-red-900/30 bg-red-900/10 opacity-70'} relative group`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--owner-text-primary)]">{prog.name}</h3>
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold mt-2 ${prog.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                        {prog.is_active ? 'ATTIVO' : 'SOSPESO'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => toggleStatus(prog.id, prog.is_active)}
                                    className="text-[var(--owner-text-muted)] hover:text-[var(--owner-text-primary)]"
                                    title={prog.is_active ? "Disattiva" : "Attiva"}
                                >
                                    {prog.is_active ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
                                </button>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-[var(--owner-text-secondary)]">
                                <div className="flex items-center gap-2 bg-[var(--owner-bg-primary)] px-3 py-2 rounded-lg border border-[var(--owner-border)]">
                                    <Award size={16} />
                                    Target: <span className="font-bold text-[var(--owner-text-primary)]">{prog.stamps_required}</span>
                                </div>
                                <div className="flex items-center gap-2 bg-[var(--owner-bg-primary)] px-3 py-2 rounded-lg border border-[var(--owner-border)] flex-1">
                                    🎁 <span className="font-medium text-[var(--owner-text-primary)]">{prog.reward_description}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {!loading && programs.length === 0 && !showForm && (
                        <div className="col-span-full text-center py-12 text-[var(--owner-text-muted)]">
                            <Award size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Nessun programma fedeltà configurato.</p>
                            <button onClick={() => setShowForm(true)} className="text-[var(--owner-accent)] font-bold mt-2 hover:underline">
                                Creane uno ora
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoyaltySettings;
