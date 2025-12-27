import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Clock, Save, Check } from 'lucide-react';

const DAYS = [
    { value: 0, label: 'Domenica' },
    { value: 1, label: 'Lunedì' },
    { value: 2, label: 'Martedì' },
    { value: 3, label: 'Mercoledì' },
    { value: 4, label: 'Giovedì' },
    { value: 5, label: 'Venerdì' },
    { value: 6, label: 'Sabato' }
];

const ClubHoursManager = () => {
    const [hours, setHours] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchHours();
    }, []);

    const fetchHours = async () => {
        try {
            const { data, error } = await supabase
                .from('club_hours')
                .select('*')
                .order('day_of_week');

            if (error) throw error;

            // Initialize with default if empty
            if (!data || data.length === 0) {
                const defaultHours = DAYS.map(day => ({
                    day_of_week: day.value,
                    is_open: true,
                    open_time: '09:00',
                    close_time: '22:00',
                    break_start: null,
                    break_end: null
                }));
                setHours(defaultHours);
            } else {
                setHours(data);
            }
        } catch (error) {
            console.error('Error fetching hours:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (dayOfWeek, field, value) => {
        const updatedHours = hours.map(h =>
            h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h
        );
        setHours(updatedHours);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Upsert all days
            for (const dayHours of hours) {
                const { error } = await supabase
                    .from('club_hours')
                    .upsert({
                        ...dayHours,
                        updated_at: new Date().toISOString()
                    }, {
                        onConflict: 'day_of_week'
                    });

                if (error) throw error;
            }

            alert('Orari salvati con successo!');
            fetchHours();
        } catch (error) {
            console.error('Error saving hours:', error);
            alert('Errore nel salvare gli orari');
        } finally {
            setSaving(false);
        }
    };

    const copyFromPrevious = (currentDay) => {
        if (currentDay === 0) return;
        const previousDay = hours.find(h => h.day_of_week === currentDay - 1);
        if (!previousDay) return;

        handleUpdate(currentDay, 'is_open', previousDay.is_open);
        handleUpdate(currentDay, 'open_time', previousDay.open_time);
        handleUpdate(currentDay, 'close_time', previousDay.close_time);
        handleUpdate(currentDay, 'break_start', previousDay.break_start);
        handleUpdate(currentDay, 'break_end', previousDay.break_end);
    };

    if (loading) {
        return (
            <div className="owner-section-card h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--owner-accent)]"></div>
            </div>
        );
    }

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center">
                            <Clock className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                            Orari Apertura
                        </h2>
                        <p className="text-sm text-[var(--owner-text-muted)]">
                            Configura gli orari di apertura settimanali del club
                        </p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="owner-btn-primary flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Save size={18} />
                        )}
                        Salva Modifiche
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                    {DAYS.map(day => {
                        const dayHours = hours.find(h => h.day_of_week === day.value) || {};

                        return (
                            <div
                                key={day.value}
                                className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-5"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-lg">{day.label}</h3>
                                    {day.value > 0 && (
                                        <button
                                            onClick={() => copyFromPrevious(day.value)}
                                            className="text-xs text-[var(--owner-accent)] hover:underline"
                                        >
                                            Copia da giorno precedente
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {/* Aperto/Chiuso */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Stato</label>
                                        <button
                                            onClick={() => handleUpdate(day.value, 'is_open', !dayHours.is_open)}
                                            className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${dayHours.is_open
                                                    ? 'bg-green-500/10 text-green-500 border-2 border-green-500'
                                                    : 'bg-red-500/10 text-red-500 border-2 border-red-500'
                                                }`}
                                        >
                                            {dayHours.is_open ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <Check size={16} />
                                                    Aperto
                                                </span>
                                            ) : (
                                                '✕ Chiuso'
                                            )}
                                        </button>
                                    </div>

                                    {/* Apertura */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Apertura</label>
                                        <input
                                            type="time"
                                            value={dayHours.open_time || ''}
                                            onChange={(e) => handleUpdate(day.value, 'open_time', e.target.value)}
                                            disabled={!dayHours.is_open}
                                            className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] disabled:opacity-50"
                                        />
                                    </div>

                                    {/* Chiusura */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Chiusura</label>
                                        <input
                                            type="time"
                                            value={dayHours.close_time || ''}
                                            onChange={(e) => handleUpdate(day.value, 'close_time', e.target.value)}
                                            disabled={!dayHours.is_open}
                                            className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] disabled:opacity-50"
                                        />
                                    </div>

                                    {/* Pausa */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Pausa (opzionale)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="time"
                                                value={dayHours.break_start || ''}
                                                onChange={(e) => handleUpdate(day.value, 'break_start', e.target.value || null)}
                                                disabled={!dayHours.is_open}
                                                placeholder="Inizio"
                                                className="flex-1 px-2 py-2 text-sm rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] disabled:opacity-50"
                                            />
                                            <input
                                                type="time"
                                                value={dayHours.break_end || ''}
                                                onChange={(e) => handleUpdate(day.value, 'break_end', e.target.value || null)}
                                                disabled={!dayHours.is_open}
                                                placeholder="Fine"
                                                className="flex-1 px-2 py-2 text-sm rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ClubHoursManager;
