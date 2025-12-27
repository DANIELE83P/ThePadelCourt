import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const DAYS_MAP = {
    1: 'Lun', 2: 'Mar', 3: 'Mer', 4: 'Gio', 5: 'Ven', 6: 'Sab', 0: 'Dom'
};

const CourtPricingManager = () => {
    const [courts, setCourts] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [pricings, setPricings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPricing, setEditingPricing] = useState(null);
    const [form, setForm] = useState({
        name: '',
        price: '',
        time_start: '',
        time_end: '',
        day_of_week: [],
        priority: 0,
        is_active: true
    });

    useEffect(() => {
        fetchCourts();
    }, []);

    useEffect(() => {
        if (selectedCourt) {
            fetchPricings(selectedCourt.id);
        }
    }, [selectedCourt]);

    const fetchCourts = async () => {
        try {
            const { data, error } = await supabase
                .from('courts')
                .select('*')
                .order('number');

            if (error) throw error;
            setCourts(data || []);
            if (data && data.length > 0) {
                setSelectedCourt(data[0]);
            }
        } catch (error) {
            console.error('Error fetching courts:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPricings = async (courtId) => {
        try {
            const { data, error } = await supabase
                .from('court_pricing')
                .select('*')
                .eq('court_id', courtId)
                .eq('is_active', true)
                .order('priority', { ascending: false });

            if (error) throw error;
            setPricings(data || []);
        } catch (error) {
            console.error('Error fetching pricings:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...form,
                court_id: selectedCourt.id,
                price: parseFloat(form.price),
                updated_at: new Date().toISOString()
            };

            if (editingPricing) {
                const { error } = await supabase
                    .from('court_pricing')
                    .update(payload)
                    .eq('id', editingPricing.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('court_pricing')
                    .insert([payload]);

                if (error) throw error;
            }

            setShowModal(false);
            setEditingPricing(null);
            resetForm();
            fetchPricings(selectedCourt.id);
        } catch (error) {
            console.error('Error saving pricing:', error);
            alert('Errore nel salvare il prezzo');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questa regola di prezzo?')) return;

        try {
            const { error } = await supabase
                .from('court_pricing')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            fetchPricings(selectedCourt.id);
        } catch (error) {
            console.error('Error deleting pricing:', error);
        }
    };

    const resetForm = () => {
        setForm({
            name: '',
            price: '',
            time_start: '',
            time_end: '',
            day_of_week: [],
            priority: 0,
            is_active: true
        });
    };

    const getDaysLabel = (dayArray) => {
        if (!dayArray || dayArray.length === 0) return 'Tutti i giorni';
        if (dayArray.length === 7) return 'Tutti i giorni';
        return dayArray.map(d => DAYS_MAP[d]).join(', ');
    };

    const toggleDay = (day) => {
        const current = form.day_of_week || [];
        if (current.includes(day)) {
            setForm({ ...form, day_of_week: current.filter(d => d !== day) });
        } else {
            setForm({ ...form, day_of_week: [...current, day] });
        }
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center">
                            <DollarSign className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                            Prezzi Dinamici
                        </h2>
                        <p className="text-sm text-[var(--owner-text-muted)]">
                            Configura prezzi per fasce orarie e giorni della settimana
                        </p>
                    </div>
                    {selectedCourt && (
                        <button
                            onClick={() => {
                                setEditingPricing(null);
                                resetForm();
                                setShowModal(true);
                            }}
                            className="owner-btn-primary flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Nuova Regola
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Court Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium mb-2">Seleziona Campo</label>
                    <div className="flex gap-2 flex-wrap">
                        {courts.map(court => (
                            <button
                                key={court.id}
                                onClick={() => setSelectedCourt(court)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedCourt?.id === court.id
                                        ? 'bg-[var(--owner-accent)] text-white'
                                        : 'bg-[var(--owner-bg-secondary)] text-[var(--owner-text-secondary)] hover:bg-[var(--owner-border)]'
                                    }`}
                            >
                                {court.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Pricings List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--owner-accent)] mx-auto"></div>
                    </div>
                ) : !selectedCourt ? (
                    <div className="text-center py-20">
                        <DollarSign size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[var(--owner-text-muted)]">Nessun campo disponibile</p>
                    </div>
                ) : pricings.length === 0 ? (
                    <div className="text-center py-20 bg-[var(--owner-card-bg)] rounded-2xl border border-dashed border-[var(--owner-border)]">
                        <DollarSign size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[var(--owner-text-muted)] mb-2">Nessuna regola di prezzo configurata</p>
                        <p className="text-xs text-[var(--owner-text-muted)]">Clicca "Nuova Regola" per iniziare</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {pricings.map(pricing => (
                            <div
                                key={pricing.id}
                                className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-5 hover:border-[var(--owner-accent)] transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg">{pricing.name}</h3>
                                            <span className="text-2xl font-bold text-[var(--owner-accent)]">
                                                €{pricing.price}
                                            </span>
                                            {pricing.priority > 0 && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                                                    Priorità {pricing.priority}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="text-[var(--owner-text-muted)]">Orario:</span>
                                                <span className="ml-2 font-medium">{pricing.time_start} - {pricing.time_end}</span>
                                            </div>
                                            <div>
                                                <span className="text-[var(--owner-text-muted)]">Giorni:</span>
                                                <span className="ml-2 font-medium">{getDaysLabel(pricing.day_of_week)}</span>
                                            </div>
                                        </div>

                                        {pricing.description && (
                                            <p className="text-sm text-[var(--owner-text-muted)] mt-2">
                                                {pricing.description}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingPricing(pricing);
                                                setForm(pricing);
                                                setShowModal(true);
                                            }}
                                            className="p-2 rounded-lg bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-accent)] hover:text-white"
                                            title="Modifica"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(pricing.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            title="Elimina"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--owner-card-bg)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">
                                {editingPricing ? 'Modifica Regola' : 'Nuova Regola Prezzo'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-[var(--owner-bg-secondary)]">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Nome Regola</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-  border)]"
                                    placeholder="es. Fascia Serale"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Prezzo (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={form.price}
                                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                    placeholder="25.00"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Ora Inizio</label>
                                    <input
                                        type="time"
                                        value={form.time_start}
                                        onChange={(e) => setForm({ ...form, time_start: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Ora Fine</label>
                                    <input
                                        type="time"
                                        value={form.time_end}
                                        onChange={(e) => setForm({ ...form, time_end: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Giorni Applicabili</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[1, 2, 3, 4, 5, 6, 0].map(day => (
                                        <button
                                            key={day}
                                            type="button"
                                            onClick={() => toggleDay(day)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-all ${form.day_of_week?.includes(day)
                                                    ? 'bg-[var(--owner-accent)] text-white'
                                                    : 'bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-border)]'
                                                }`}
                                        >
                                            {DAYS_MAP[day]}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-[var(--owner-text-muted)] mt-2">
                                    Lascia vuoto per applicare tutti i giorni
                                </p>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--owner-border)]">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-border)]"
                                >
                                    Annulla
                                </button>
                                <button type="submit" className="owner-btn-primary flex items-center gap-2">
                                    <Save size={18} />
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourtPricingManager;
