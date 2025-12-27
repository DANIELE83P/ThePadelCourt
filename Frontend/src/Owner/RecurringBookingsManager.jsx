import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { Repeat, Plus, Edit2, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import UserSelector from './UserSelector';
import { isSlotAvailable } from '../services/bookingValidation';
import { notify } from '../utils/notification';

const DAYS_MAP = {
    1: 'Lunedì', 2: 'Martedì', 3: 'Mercoledì', 4: 'Giovedì',
    5: 'Venerdì', 6: 'Sabato', 0: 'Domenica'
};

const RecurringBookingsManager = () => {
    const { user } = useAuth();
    const [recurringBookings, setRecurringBookings] = useState([]);
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showConflictModal, setShowConflictModal] = useState(false);
    const [conflicts, setConflicts] = useState([]);
    const [editingBooking, setEditingBooking] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({
        customer_name: '',
        customer_phone: '',
        court_id: '',
        day_of_week: 1, // 1=Monday
        time_start: '',
        duration_minutes: 90,
        recurrence_pattern: 'weekly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        admin_notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [bookingsRes, courtsRes] = await Promise.all([
                supabase
                    .from('recurring_bookings')
                    .select('*, courts(*)')
                    .eq('is_active', true)
                    .order('day_of_week'),
                supabase
                    .from('courts')
                    .select('*')
                    .order('number', { ascending: true }) // Added ordering by number
            ]);

            if (bookingsRes.error) throw bookingsRes.error;
            if (courtsRes.error) throw courtsRes.error;

            setRecurringBookings(bookingsRes.data || []);
            setCourts(courtsRes.data || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            // Fallback if 'number' column doesn't exist yet (migration pending)
            if (error.code === '42703') { // Undefined column
                fetchCourtsFallback();
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchCourtsFallback = async () => {
        const { data } = await supabase.from('courts').select('*');
        setCourts(data || []);
    };

    // Helper to generate dates for potential bookings
    const generateBookingDates = () => {
        const dates = [];
        let currentDate = new Date(form.start_date);
        const endDate = form.end_date ? new Date(form.end_date) : new Date(currentDate);
        if (!form.end_date) endDate.setMonth(endDate.getMonth() + 3); // Default 3 months generation

        // Adjust start date to match the selected day of week
        // form.day_of_week: 0=Sun, 1=Mon... but input/state might be 1-7 or 0-6
        // Let's assume input selects 1=Mon...7=Sun but Date.getDay() returns 0=Sun, 1=Mon
        // We need to clarify DAYS_MAP usage. Let's align with JS Date.getDay() (0-6)
        // If select value is 1 (Mon), target is 1. If 7 (Sun), target is 0.

        let targetDay = parseInt(form.day_of_week);
        if (targetDay === 7) targetDay = 0; // Handle Sunday mapping if needed

        while (currentDate.getDay() !== targetDay) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        while (currentDate <= endDate) {
            dates.push(new Date(currentDate));
            if (form.recurrence_pattern === 'weekly') {
                currentDate.setDate(currentDate.getDate() + 7);
            } else if (form.recurrence_pattern === 'biweekly') {
                currentDate.setDate(currentDate.getDate() + 14);
            }
        }
        return dates;
    };

    const checkConflicts = async (dates) => {
        const conflictList = [];
        const endTimeDate = new Date(`2000-01-01T${form.time_start}`);
        endTimeDate.setMinutes(endTimeDate.getMinutes() + parseInt(form.duration_minutes));
        const timeEnd = endTimeDate.toTimeString().slice(0, 5);

        for (const date of dates) {
            const dateStr = date.toISOString().split('T')[0];
            const isAvailable = await isSlotAvailable(form.court_id, dateStr, form.time_start, timeEnd);

            if (!isAvailable) {
                conflictList.push(dateStr);
            }
        }
        return conflictList;
    };

    const handlePreSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const dates = generateBookingDates();
        const foundConflicts = await checkConflicts(dates);

        if (foundConflicts.length > 0) {
            setConflicts(foundConflicts);
            setShowConflictModal(true);
            setSaving(false);
        } else {
            finalizeSubmit();
        }
    };

    const finalizeSubmit = async () => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                user_id: user.id, // Creator ID
                customer_id: selectedUser?.id || null, // Linked customer if selected
                customer_name: selectedUser ? selectedUser.full_name : form.customer_name, // Use selected user name or manual input
                customer_phone: selectedUser ? selectedUser.phone : form.customer_phone,
                customer_email: selectedUser?.email || null,
                created_by: user.id,
                updated_at: new Date().toISOString()
            };

            let recurringId;

            // 1. Create/Update Master Recurring Record
            if (editingBooking) {
                const { error } = await supabase
                    .from('recurring_bookings')
                    .update(payload)
                    .eq('id', editingBooking.id);
                if (error) throw error;
                recurringId = editingBooking.id;
            } else {
                const { data, error } = await supabase
                    .from('recurring_bookings')
                    .insert([payload])
                    .select()
                    .single();
                if (error) throw error;
                recurringId = data.id;
            }

            // 2. Generate Real Bookings (only for non-conflicting dates)
            const dates = generateBookingDates();
            const endTimeDate = new Date(`2000-01-01T${form.time_start}`);
            endTimeDate.setMinutes(endTimeDate.getMinutes() + parseInt(form.duration_minutes));
            const timeEnd = endTimeDate.toTimeString().slice(0, 5);

            const bookingsToInsert = [];
            for (const date of dates) {
                const dateStr = date.toISOString().split('T')[0];
                const isAvailable = await isSlotAvailable(form.court_id, dateStr, form.time_start, timeEnd);

                if (isAvailable && !conflicts.includes(dateStr)) {
                    bookingsToInsert.push({
                        court_id: form.court_id,
                        booking_date: dateStr,
                        time_slot_start: form.time_start,
                        time_slot_end: timeEnd,
                        customer_name: payload.customer_name,
                        customer_phone: payload.customer_phone,
                        customer_email: payload.customer_email,
                        user_id: payload.customer_id, // Link to real user if selected
                        recurring_booking_id: recurringId,
                        is_recurring: true,
                        status: 'confirmed',
                        created_by: user.id,
                        is_guest: !payload.customer_id
                    });
                }
            }

            if (bookingsToInsert.length > 0) {
                const { error: bookingError } = await supabase
                    .from('bookings')
                    .insert(bookingsToInsert);

                if (bookingError) console.error('Error creating individual bookings:', bookingError);
            }

            // 3. Send Notification
            if (payload.customer_id && payload.customer_email) {
                const courtName = courts.find(c => c.id === form.court_id)?.name || 'Campo';
                const dayName = DAYS_MAP[form.day_of_week] || 'Giorno';

                await notify.bookingRecurringCreated({
                    userId: payload.customer_id,
                    email: payload.customer_email,
                    firstName: payload.customer_name.split(' ')[0],
                    courtName: courtName,
                    dayOfWeek: dayName,
                    time: form.time_start,
                    startDate: form.start_date,
                    endDate: form.end_date
                });
            }

            // Cleanup
            setShowModal(false);
            setShowConflictModal(false);
            setEditingBooking(null);
            setConflicts([]);
            resetForm();
            fetchData();
        } catch (error) {
            console.error('Error saving recurring booking:', error);
            alert('Errore nel salvare la prenotazione ricorrente: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questa ricorrenza? Le prenotazioni future verranno mantenute ma scollegate, o vuoi cancellare anche quelle? (Questa logica è da affinare)')) return;

        try {
            const { error } = await supabase
                .from('recurring_bookings')
                .update({ is_active: false })
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting recurring booking:', error);
        }
    };

    const resetForm = () => {
        setForm({
            customer_name: '',
            customer_phone: '',
            court_id: '',
            day_of_week: 1,
            time_start: '',
            duration_minutes: 90,
            recurrence_pattern: 'weekly',
            start_date: new Date().toISOString().split('T')[0],
            end_date: '',
            admin_notes: ''
        });
        setSelectedUser(null);
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center">
                            <Repeat className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                            Prenotazioni Ricorrenti
                        </h2>
                        <p className="text-sm text-[var(--owner-text-muted)]">
                            Gestisci abbonamenti fissi e genera automaticamente le prenotazioni nel calendario
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingBooking(null);
                            resetForm();
                            setShowModal(true);
                        }}
                        className="owner-btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nuova Ricorrenza
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--owner-accent)] mx-auto"></div>
                    </div>
                ) : recurringBookings.length === 0 ? (
                    <div className="text-center py-20">
                        <Repeat size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[var(--owner-text-muted)]">Nessuna prenotazione ricorrente configurata</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {recurringBookings.map(booking => (
                            <div
                                key={booking.id}
                                className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-5 hover:border-[var(--owner-accent)] transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-bold text-lg">{booking.customer_name}</h3>
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--owner-accent)]/10 text-[var(--owner-accent)]">
                                                {booking.recurrence_pattern === 'weekly' ? 'Settimanale' : 'Bisettimanale'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                            <div>
                                                <span className="text-[var(--owner-text-muted)]">📅 Giorno:</span>
                                                <span className="ml-2 font-medium">{DAYS_MAP[booking.day_of_week] || 'Domenica'}</span>
                                            </div>
                                            <div>
                                                <span className="text-[var(--owner-text-muted)]">🕐 Orario:</span>
                                                <span className="ml-2 font-medium">{booking.time_start} ({booking.duration_minutes}min)</span>
                                            </div>
                                            <div>
                                                <span className="text-[var(--owner-text-muted)]">🎾 Campo:</span>
                                                <span className="ml-2 font-medium">{booking.courts?.name}</span>
                                            </div>
                                        </div>

                                        {booking.customer_phone && (
                                            <div className="text-sm text-[var(--owner-text-muted)] mt-2">
                                                📞 {booking.customer_phone}
                                            </div>
                                        )}

                                        {booking.admin_notes && (
                                            <div className="text-sm text-[var(--owner-text-muted)] mt-2 italic border-l-2 border-gray-300 pl-2">
                                                {booking.admin_notes}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-3 text-xs text-[var(--owner-text-muted)] mt-3 bg-gray-50 p-2 rounded w-fit">
                                            <span>Inizio: {new Date(booking.start_date).toLocaleDateString('it-IT')}</span>
                                            {booking.end_date && (
                                                <span>• Fine: {new Date(booking.end_date).toLocaleDateString('it-IT')}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingBooking(booking);
                                                setForm({
                                                    ...booking,
                                                    court_id: booking.court_id || booking.courts?.id,
                                                    day_of_week: booking.day_of_week || 1
                                                });
                                                setShowModal(true);
                                            }}
                                            className="p-2 rounded-lg bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-accent)] hover:text-white"
                                            title="Modifica"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(booking.id)}
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

            {/* Main Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--owner-card-bg)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">
                                {editingBooking ? 'Modifica Ricorrenza' : 'Nuova Prenotazione Ricorrente'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-[var(--owner-bg-secondary)]">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handlePreSubmit} className="space-y-6">

                            {/* User Selection Section */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-semibold mb-3 text-gray-700">Seleziona Cliente</label>
                                <UserSelector
                                    selectedUser={selectedUser}
                                    onSelect={(user) => {
                                        setSelectedUser(user);
                                        if (user) {
                                            setForm(prev => ({
                                                ...prev,
                                                customer_name: user.full_name,
                                                customer_phone: user.phone || prev.customer_phone
                                            }));
                                        }
                                    }}
                                />
                                {!selectedUser && (
                                    <div className="mt-3 grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium mb-1 text-gray-500">Nome (Manuale)</label>
                                            <input
                                                type="text"
                                                value={form.customer_name}
                                                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                                                className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-sm"
                                                placeholder="Mario Rossi"
                                                required={!selectedUser}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium mb-1 text-gray-500">Telefono (Manuale)</label>
                                            <input
                                                type="tel"
                                                value={form.customer_phone}
                                                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                                                className="w-full px-3 py-2 rounded-md bg-white border border-gray-300 text-sm"
                                                placeholder="333 1234567"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Campo</label>
                                    <select
                                        value={form.court_id}
                                        onChange={(e) => setForm({ ...form, court_id: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] appearance-none"
                                        required
                                    >
                                        <option value="">Seleziona...</option>
                                        {courts.map(court => (
                                            <option key={court.id} value={court.id}>{court.name} {court.is_indoor ? '(Coperto)' : '(Scoperto)'}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Giorno Settimana</label>
                                    <select
                                        value={form.day_of_week}
                                        onChange={(e) => setForm({ ...form, day_of_week: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] appearance-none"
                                        required
                                    >
                                        {Object.entries(DAYS_MAP).map(([day, name]) => (
                                            <option key={day} value={day}>{name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Orario Inizio</label>
                                    <input
                                        type="time"
                                        value={form.time_start}
                                        onChange={(e) => setForm({ ...form, time_start: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Durata</label>
                                    <select
                                        value={form.duration_minutes}
                                        onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] appearance-none"
                                        required
                                    >
                                        <option value={60}>60 min</option>
                                        <option value={90}>90 min</option>
                                        <option value={120}>120 min</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Frequenza</label>
                                    <select
                                        value={form.recurrence_pattern}
                                        onChange={(e) => setForm({ ...form, recurrence_pattern: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] appearance-none"
                                        required
                                    >
                                        <option value="weekly">Settimanale (ogni settimana)</option>
                                        <option value="biweekly">Bisettimanale (ogni 2 settimane)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Data Inizio</label>
                                    <input
                                        type="date"
                                        value={form.start_date}
                                        onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                                        className="w-full px-4 py-2.5 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Data Fine (Genera fino al...)</label>
                                <input
                                    type="date"
                                    value={form.end_date}
                                    onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                />
                                <p className="text-xs text-[var(--owner-text-muted)] mt-1">Se vuoto, verranno generate prenotazioni per 3 mesi.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Note Admin (opzionali)</label>
                                <textarea
                                    value={form.admin_notes}
                                    onChange={(e) => setForm({ ...form, admin_notes: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] min-h-[80px]"
                                    placeholder="Note interne..."
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-6 border-t border-[var(--owner-border)]">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-border)] font-medium"
                                    disabled={saving}
                                >
                                    Annulla
                                </button>
                                <button type="submit" className="owner-btn-primary flex items-center gap-2" disabled={saving}>
                                    {saving ? 'Verifica...' : (
                                        <>
                                            <Save size={18} />
                                            Salva e Genera
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Conflict Modal */}
            {showConflictModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <AlertTriangle size={32} />
                            <h3 className="text-xl font-bold">Conflitti Rilevati</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Alcune date della ricorrenza sono già occupate. Vuoi procedere comunque?
                            <br />
                            <span className="text-sm italic">Le prenotazioni verranno create solo per le date libere.</span>
                        </p>

                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6 max-h-40 overflow-y-auto">
                            <ul className="list-disc pl-5 text-sm text-amber-800">
                                {conflicts.map((date, idx) => (
                                    <li key={idx}>Occupato: {new Date(date).toLocaleDateString('it-IT')}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowConflictModal(false)}
                                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={() => finalizeSubmit()}
                                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium"
                            >
                                Procedi Comunque
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringBookingsManager;
