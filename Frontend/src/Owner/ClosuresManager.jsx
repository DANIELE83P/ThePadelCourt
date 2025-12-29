import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { CalendarX, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const CLOSURE_TYPES = [
    { value: 'festive', label: 'Festiva', icon: '🎉' },
    { value: 'ordinary', label: 'Ordinaria', icon: '📅' },
    { value: 'extraordinary', label: 'Straordinaria', icon: '⚠️' }
];

const ClosuresManager = () => {
    const { user } = useAuth();
    const [closures, setClosures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClosure, setEditingClosure] = useState(null);
    const [form, setForm] = useState({
        closure_type: 'festive',
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        is_recurring: false
    });

    useEffect(() => {
        fetchClosures();
    }, []);

    const fetchClosures = async () => {
        try {
            const { data, error } = await supabase
                .from('club_closures')
                .select('*')
                .eq('is_active', true)
                .order('start_date', { ascending: true });

            if (error) throw error;
            setClosures(data || []);
        } catch (error) {
            console.error('Error fetching closures:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...form,
                created_by: user.id,
                updated_at: new Date().toISOString()
            };

            if (editingClosure) {
                const { error } = await supabase
                    .from('club_closures')
                    .update(payload)
                    .eq('id', editingClosure.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('club_closures')
                    .insert([payload]);

                if (error) throw error;
            }

            setShowModal(false);
            setEditingClosure(null);
            resetForm();
            fetchClosures();
        } catch (error) {
            console.error('Error saving closure:', error);
            alert('Errore nel salvare la chiusura');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questa chiusura?')) return;

        try {
            const { error } = await supabase
                .from('club_closures')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            fetchClosures();
        } catch (error) {
            console.error('Error deleting closure:', error);
        }
    };

    const resetForm = () => {
        setForm({
            closure_type: 'festive',
            title: '',
            description: '',
            start_date: '',
            end_date: '',
            is_recurring: false
        });
    };

    const getTypeInfo = (type) => {
        return CLOSURE_TYPES.find(t => t.value === type) || CLOSURE_TYPES[0];
    };

    const isActive = (closure) => {
        const today = new Date().toISOString().split('T')[0];
        return closure.start_date <= today && closure.end_date >= today;
    };

    const isPast = (closure) => {
        const today = new Date().toISOString().split('T')[0];
        return closure.end_date < today;
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center">
                            <CalendarX className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                            Chiusure
                        </h2>
                        <p className="text-sm text-[var(--owner-text-muted)]">
                            Gestisci chiusure festive, ordinarie e straordinarie
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingClosure(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="owner-btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nuova Chiusura
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--owner-accent)] mx-auto"></div>
                    </div>
                ) : closures.length === 0 ? (
                    <div className="text-center py-20">
                        <CalendarX size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[var(--owner-text-muted)]">Nessuna chiusura programmata</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {closures.map(closure => {
                            const typeInfo = getTypeInfo(closure.closure_type);
                            const active = isActive(closure);
                            const past = isPast(closure);

                            return (
                                <div
                                    key={closure.id}
                                    className={`bg-[var(--owner-card-bg)] border rounded-xl p-5 transition-all ${active
                                        ? 'border-red-500 bg-red-500/5'
                                        : past
                                            ? 'border-[var(--owner-border)] opacity-60'
                                            : 'border-[var(--owner-border)] hover:border-[var(--owner-accent)]'
                                        }`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-2xl">{typeInfo.icon}</span>
                                                <div>
                                                    <h3 className="font-bold text-lg">{closure.title}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--owner-bg-secondary)] text-[var(--owner-text-secondary)]">
                                                            {typeInfo.label}
                                                        </span>
                                                        {active && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                                                                In corso
                                                            </span>
                                                        )}
                                                        {past && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500 text-white">
                                                                Passata
                                                            </span>
                                                        )}
                                                        {closure.is_recurring && (
                                                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                                                                🔁 Ricorrente
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-sm text-[var(--owner-text-muted)] mb-3">
                                                {closure.description || 'Nessuna descrizione'}
                                            </p>

                                            <div className="flex items-center gap-4 text-sm">
                                                <span className="text-[var(--owner-text-secondary)]">
                                                    📅 Dal: <span className="font-medium">{new Date(closure.start_date).toLocaleDateString('it-IT')}</span>
                                                </span>
                                                <span className="text-[var(--owner-text-secondary)]">
                                                    Al: <span className="font-medium">{new Date(closure.end_date).toLocaleDateString('it-IT')}</span>
                                                </span>
                                            </div>
                                        </div>

                                        {!past && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingClosure(closure);
                                                        setForm(closure);
                                                        setShowModal(true);
                                                    }}
                                                    className="p-2 rounded-lg bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-accent)] hover:text-white"
                                                    title="Modifica"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(closure.id)}
                                                    className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                    title="Elimina"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[rgba(224,229,242,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--owner-card-bg)] rounded-[var(--owner-radius-lg)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[var(--owner-shadow-premium)] border border-[var(--owner-border)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">
                                {editingClosure ? 'Modifica Chiusura' : 'Nuova Chiusura'}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-lg hover:bg-[var(--owner-bg-secondary)]"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tipo</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {CLOSURE_TYPES.map(type => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setForm({ ...form, closure_type: type.value })}
                                            className={`p-3 rounded-lg border-2 transition-all ${form.closure_type === type.value
                                                ? 'border-[var(--owner-accent)] bg-[var(--owner-accent)]/10'
                                                : 'border-[var(--owner-border)] hover:border-[var(--owner-accent)]/50'
                                                }`}
                                        >
                                            <div className="text-2xl mb-1">{type.icon}</div>
                                            <div className="text-xs font-medium">{type.label}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Titolo</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)]"
                                    placeholder="es. Chiusura estiva"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Descrizione (opzionale)</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] min-h-[80px]"
                                    placeholder="Note aggiuntive..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Data Inizio</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Data Fine</label>
                                    <input
                                        type="date"
                                        value={form.end_date}
                                        onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)]"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={form.is_recurring}
                                        onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm font-medium">Chiusura ricorrente (ogni anno)</span>
                                </label>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--owner-border)]">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg bg-[var(--owner-bg-primary)] hover:bg-[var(--owner-border)]"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="owner-btn-primary flex items-center gap-2"
                                >
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

export default ClosuresManager;
