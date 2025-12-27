import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { Award, Plus, Trash2, CheckCircle, XCircle, Clock, Target, Gift, AlertTriangle } from "lucide-react";

const LoyaltySettings = () => {
    const { user } = useAuth();
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: "",
        stamps_required: 10,
        reward_description: "",
        auto_assign: true,
        has_time_based_rewards: false,
        reset_period_type: "NEVER",
        reset_period_value: null,
        warning_days_before_reset: 7,
        rules_description: ""
    });

    // Tiers State
    const [tiers, setTiers] = useState([]);
    const [newTier, setNewTier] = useState({
        tier_level: 1,
        time_limit_days: 30,
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

    const fetchTiers = async (programId) => {
        try {
            const { data, error } = await supabase
                .from('loyalty_reward_tiers')
                .select('*')
                .eq('program_id', programId)
                .order('tier_level', { ascending: true });

            if (error) throw error;
            setTiers(data || []);
        } catch (error) {
            console.error("Error fetching tiers:", error);
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

            // Insert tiers if time-based rewards enabled
            if (formData.has_time_based_rewards && tiers.length > 0) {
                const tiersToInsert = tiers.map(t => ({ ...t, program_id: data.id }));
                await supabase.from('loyalty_reward_tiers').insert(tiersToInsert);
            }

            setPrograms([data, ...programs]);
            resetForm();
            alert("Programma creato con successo!");
        } catch (error) {
            console.error("Error creating program:", error);
            alert("Errore nella creazione del programma.");
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingProgram(null);
        setFormData({
            name: "",
            stamps_required: 10,
            reward_description: "",
            auto_assign: true,
            has_time_based_rewards: false,
            reset_period_type: "NEVER",
            reset_period_value: null,
            warning_days_before_reset: 7,
            rules_description: ""
        });
        setTiers([]);
        setNewTier({ tier_level: 1, time_limit_days: 30, stamps_required: 10, reward_description: "" });
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

    const addTier = () => {
        if (!newTier.reward_description || newTier.stamps_required < 1) {
            alert("Compila tutti i campi del tier");
            return;
        }
        setTiers([...tiers, { ...newTier }]);
        setNewTier({
            tier_level: newTier.tier_level + 1,
            time_limit_days: newTier.time_limit_days + 30,
            stamps_required: newTier.stamps_required,
            reward_description: ""
        });
    };

    const removeTier = (index) => {
        setTiers(tiers.filter((_, i) => i !== index));
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
                        Configura programmi con premi scalari e notifiche automatiche.
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
                    <form onSubmit={handleSubmit} className="mb-8 bg-[var(--owner-bg-secondary)] p-6 rounded-xl border border-[var(--owner-border)] space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Timbri Richiesti (Base)</label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    value={formData.stamps_required}
                                    onChange={e => setFormData({ ...formData, stamps_required: parseInt(e.target.value) })}
                                    disabled={formData.has_time_based_rewards}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Premio (Base)</label>
                                <input
                                    type="text"
                                    required={!formData.has_time_based_rewards}
                                    placeholder="es. 1 Partita Gratis"
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    value={formData.reward_description}
                                    onChange={e => setFormData({ ...formData, reward_description: e.target.value })}
                                    disabled={formData.has_time_based_rewards}
                                />
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center gap-3 bg-[var(--owner-bg-primary)] p-4 rounded-lg border border-[var(--owner-border)] cursor-pointer hover:border-[var(--owner-accent)] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.auto_assign}
                                    onChange={e => setFormData({ ...formData, auto_assign: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <div>
                                    <div className="font-semibold text-[var(--owner-text-primary)]">Auto-Assegnazione</div>
                                    <div className="text-xs text-[var(--owner-text-muted)]">Assegna automaticamente a nuovi utenti</div>
                                </div>
                            </label>

                            <label className="flex items-center gap-3 bg-[var(--owner-bg-primary)] p-4 rounded-lg border border-[var(--owner-border)] cursor-pointer hover:border-[var(--owner-accent)] transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.has_time_based_rewards}
                                    onChange={e => setFormData({ ...formData, has_time_based_rewards: e.target.checked })}
                                    className="w-5 h-5"
                                />
                                <div>
                                    <div className="font-semibold text-[var(--owner-text-primary)]">Premi Scalari Basati sul Tempo</div>
                                    <div className="text-xs text-[var(--owner-text-muted)]">Premi diversi in base alla velocità</div>
                                </div>
                            </label>
                        </div>

                        {/* Time-Based Tiers */}
                        {formData.has_time_based_rewards && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-2 mb-4">
                                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
                                    <div className="text-sm text-amber-300">
                                        <strong>Premi Scalari Abilitati</strong>: Definisci i livelli di premio in base al tempo impiegato.
                                    </div>
                                </div>

                                {/* Tiers List */}
                                {tiers.length > 0 && (
                                    <div className="space-y-2 mb-4">
                                        {tiers.map((tier, index) => (
                                            <div key={index} className="flex items-center gap-3 bg-[var(--owner-bg-primary)] p-3 rounded-lg">
                                                <span className="font-bold text-[var(--owner-accent)]">Livello {tier.tier_level}</span>
                                                <span className="text-sm text-[var(--owner-text-secondary)]">
                                                    {tier.stamps_required} timbri in {tier.time_limit_days} giorni
                                                </span>
                                                <span className="text-sm flex-1">→ {tier.reward_description}</span>
                                                <button onClick={() => removeTier(index)} className="text-red-500 hover:text-red-400">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Add Tier Form */}
                                <div className="grid grid-cols-4 gap-3">
                                    <input
                                        type="number"
                                        placeholder="Timbri"
                                        min="1"
                                        value={newTier.stamps_required}
                                        onChange={e => setNewTier({ ...newTier, stamps_required: parseInt(e.target.value) })}
                                        className="bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded p-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Giorni"
                                        min="1"
                                        value={newTier.time_limit_days}
                                        onChange={e => setNewTier({ ...newTier, time_limit_days: parseInt(e.target.value) })}
                                        className="bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded p-2 text-sm"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Premio"
                                        value={newTier.reward_description}
                                        onChange={e => setNewTier({ ...newTier, reward_description: e.target.value })}
                                        className="bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded p-2 text-sm col-span-2"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addTier}
                                    className="mt-2 text-sm bg-[var(--owner-accent)] text-white px-3 py-1 rounded hover:bg-[var(--owner-accent-hover)] flex items-center gap-1"
                                >
                                    <Plus size={14} /> Aggiungi Livello
                                </button>
                            </div>
                        )}

                        {/* Rules Description */}
                        <div>
                            <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Regolamento (Opzionale)</label>
                            <textarea
                                rows="3"
                                placeholder="Descrivi le regole del programma che gli utenti vedranno nella loro sezione..."
                                className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none resize-none"
                                value={formData.rules_description}
                                onChange={e => setFormData({ ...formData, rules_description: e.target.value })}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={resetForm} className="px-6 py-2 rounded-lg border border-[var(--owner-border)] text-[var(--owner-text-secondary)] hover:bg-[var(--owner-bg-primary)]">
                                Annulla
                            </button>
                            <button type="submit" className="bg-[var(--owner-accent)] text-white px-6 py-2 rounded-lg font-bold hover:bg-[var(--owner-accent-hover)] transition-colors">
                                Crea Programma
                            </button>
                        </div>
                    </form>
                )}

                {/* Programs List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {programs.map(prog => (
                        <div key={prog.id} className={`p-6 rounded-xl border ${prog.is_active ? 'border-[var(--owner-border)] bg-[var(--owner-card-bg)]' : 'border-red-900/30 bg-red-900/10 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-[var(--owner-text-primary)]">{prog.name}</h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${prog.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {prog.is_active ? 'ATTIVO' : 'SOSPESO'}
                                        </span>
                                        {prog.auto_assign && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-blue-500/10 text-blue-400">
                                                AUTO-ASSIGN
                                            </span>
                                        )}
                                        {prog.has_time_based_rewards && (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-500/10 text-amber-400">
                                                PREMI SCALARI
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleStatus(prog.id, prog.is_active)}
                                    className="text-[var(--owner-text-muted)] hover:text-[var(--owner-text-primary)]"
                                >
                                    {prog.is_active ? <CheckCircle size={20} className="text-green-500" /> : <XCircle size={20} className="text-red-500" />}
                                </button>
                            </div>

                            <div className="space-y-2">
                                {!prog.has_time_based_rewards && (
                                    <div className="flex items-center justify-between bg-[var(--owner-bg-primary)] px-3 py-2 rounded-lg">
                                        <span className="text-sm text-[var(--owner-text-secondary)]">Target Timbri:</span>
                                        <span className="font-bold text-[var(--owner-text-primary)]">{prog.stamps_required}</span>
                                    </div>
                                )}
                                {!prog.has_time_based_rewards && (
                                    <div className="flex items-center gap-2 bg-[var(--owner-bg-primary)] px-3 py-2 rounded-lg">
                                        <Gift size={16} className="text-[var(--owner-accent)]" />
                                        <span className="text-sm text-[var(--owner-text-primary)]">{prog.reward_description}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {!loading && programs.length === 0 && !showForm && (
                        <div className="col-span-full text-center py-12">
                            <Award size={48} className="mx-auto mb-4 opacity-50 text-[var(--owner-text-muted)]" />
                            <p className="text-[var(--owner-text-muted)]">Nessun programma configurato.</p>
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
