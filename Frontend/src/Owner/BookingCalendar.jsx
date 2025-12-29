import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    User,
    CalendarDays,
    CalendarRange,
    List
} from "lucide-react";
import {
    format,
    addDays,
    subDays,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    startOfMonth,
    endOfMonth,
    isSameDay,
    isSameMonth,
    addWeeks,
    subWeeks,
    addMonths,
    subMonths,
    isToday
} from "date-fns";
import { it } from "date-fns/locale";
import NewBookingModal from "./NewBookingModal";

// Helper to convert time string (e.g. "08:00 AM") to minutes from midnight
const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
};

const VIEW_MODES = {
    DAY: 'day',
    WEEK: 'week',
    MONTH: 'month',
    AGENDA: 'agenda'
};

const BookingCalendar = () => {
    const { user } = useAuth();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState(VIEW_MODES.DAY);
    const [courts, setCourts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'morning', 'afternoon', 'evening'

    // Convert AM/PM time to 24h format
    const convertTo24h = (timeStr) => {
        if (!timeStr) return timeStr;
        const [time, period] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        if (user) {
            fetchCourtsAndSchedule();
        }
    }, [user, selectedDate, viewMode]);

    const getDateRange = () => {
        switch (viewMode) {
            case VIEW_MODES.WEEK:
                return {
                    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
                    end: endOfWeek(selectedDate, { weekStartsOn: 1 })
                };
            case VIEW_MODES.MONTH:
                return {
                    start: startOfMonth(selectedDate),
                    end: endOfMonth(selectedDate)
                };
            default:
                return {
                    start: selectedDate,
                    end: selectedDate
                };
        }
    };

    const fetchCourtsAndSchedule = async () => {
        try {
            setLoading(true);
            const { start, end } = getDateRange();
            const startStr = format(start, 'yyyy-MM-dd');
            const endStr = format(end, 'yyyy-MM-dd');

            // 1. Fetch Courts
            const { data: courtsData, error: courtsError } = await supabase
                .from('courts')
                .select('id, name')
                .eq('owner_id', user.id);

            if (courtsError) throw courtsError;
            setCourts(courtsData);

            if (courtsData.length === 0) {
                setSlots([]);
                return;
            }

            const courtIds = courtsData.map(c => c.id);

            // 2. Fetch Availability (Empty Slots)
            let availQuery = supabase
                .from('court_availability')
                .select('*')
                .in('court_id', courtIds)
                .eq('is_available', true);

            if (viewMode === VIEW_MODES.DAY) {
                availQuery = availQuery.eq('available_date', startStr);
            } else {
                availQuery = availQuery.gte('available_date', startStr).lte('available_date', endStr);
            }

            const { data: availData, error: availError } = await availQuery;
            if (availError) throw availError;

            // 3. Fetch Bookings (Booked Slots)
            let bookingsQuery = supabase
                .from('bookings')
                .select('*')
                .in('court_id', courtIds);

            if (viewMode === VIEW_MODES.DAY) {
                bookingsQuery = bookingsQuery.eq('booking_date', startStr);
            } else {
                bookingsQuery = bookingsQuery.gte('booking_date', startStr).lte('booking_date', endStr);
            }

            const { data: bookingsData, error: bookingsError } = await bookingsQuery;
            if (bookingsError) throw bookingsError;

            // Combine and format
            const combined = [];

            const now = new Date();
            const todayStr = format(now, 'yyyy-MM-dd');
            const currentMinutesNow = now.getHours() * 60 + now.getMinutes();

            availData.forEach(slot => {
                // Filter out past slots if they are for today
                if (slot.available_date === todayStr && timeToMinutes(slot.time_slot_start) < currentMinutesNow) {
                    return;
                }

                combined.push({
                    id: `avail-${slot.id}`,
                    courtId: slot.court_id,
                    date: slot.available_date,
                    start: slot.time_slot_start,
                    end: slot.time_slot_end,
                    type: 'available',
                    minutesStart: timeToMinutes(slot.time_slot_start),
                    data: slot
                });
            });

            bookingsData.forEach(booking => {
                combined.push({
                    id: `book-${booking.id}`,
                    courtId: booking.court_id,
                    date: booking.booking_date,
                    start: booking.time_slot_start,
                    end: booking.time_slot_end,
                    type: 'booked',
                    minutesStart: timeToMinutes(booking.time_slot_start),
                    data: booking
                });
            });

            // Sort by date and time
            combined.sort((a, b) => {
                const dateCompare = a.date.localeCompare(b.date);
                if (dateCompare !== 0) return dateCompare;
                return a.minutesStart - b.minutesStart;
            });

            setSlots(combined);

        } catch (error) {
            console.error("Error fetching schedule:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSlotClick = (slot) => {
        if (slot.type === 'available') {
            setSelectedSlot(slot);
            setIsModalOpen(true);
        } else {
            alert(`Prenotato da: ${slot.data.user_id}\nGiocatori: ${slot.data.player_names?.join(', ') || 'N/A'}`);
        }
    };

    const navigateDate = (direction) => {
        switch (viewMode) {
            case VIEW_MODES.WEEK:
                setSelectedDate(direction > 0 ? addWeeks(selectedDate, 1) : subWeeks(selectedDate, 1));
                break;
            case VIEW_MODES.MONTH:
                setSelectedDate(direction > 0 ? addMonths(selectedDate, 1) : subMonths(selectedDate, 1));
                break;
            default:
                setSelectedDate(direction > 0 ? addDays(selectedDate, 1) : subDays(selectedDate, 1));
        }
    };

    const getHeaderTitle = () => {
        switch (viewMode) {
            case VIEW_MODES.WEEK:
                const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
                return `${format(weekStart, 'd MMM', { locale: it })} - ${format(weekEnd, 'd MMM yyyy', { locale: it })}`;
            case VIEW_MODES.MONTH:
                return format(selectedDate, 'MMMM yyyy', { locale: it });
            default:
                return format(selectedDate, 'EEEE d MMMM yyyy', { locale: it });
        }
    };

    // Render Day View
    const renderDayView = () => {
        // Filter slots based on time filter
        const filterSlotsByTime = (slotsList) => {
            if (timeFilter === 'all') return slotsList;

            return slotsList.filter(slot => {
                const hour = slot.minutesStart / 60;
                if (timeFilter === 'morning') return hour >= 6 && hour < 12;
                if (timeFilter === 'afternoon') return hour >= 12 && hour < 18;
                if (timeFilter === 'evening') return hour >= 18 && hour < 24;
                return true;
            });
        };

        return (
            <div className="min-w-[800px]">
                <div className="grid grid-cols-[100px_1fr] border-b border-[var(--owner-border)]">
                    <div className="p-3 font-semibold">Orario</div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${courts.length}, 1fr)` }}>
                        {courts.map(court => (
                            <div key={court.id} className="p-3 font-bold text-center border-l border-[var(--owner-border)]">
                                {court.name}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-[100px_1fr]">
                    <div className="border-r border-[var(--owner-border)] py-2 text-xs space-y-1">
                        <div
                            className={`text-center p-2 cursor-pointer rounded transition-colors ${timeFilter === 'morning' ? 'bg-[var(--owner-accent)]/20 text-[var(--owner-accent)] font-bold' : 'hover:bg-white/5'}`}
                            onClick={() => setTimeFilter(timeFilter === 'morning' ? 'all' : 'morning')}
                        >
                            Mattina
                            <div className="text-[10px] opacity-60">6:00-12:00</div>
                        </div>
                        <div
                            className={`text-center p-2 cursor-pointer rounded transition-colors ${timeFilter === 'afternoon' ? 'bg-[var(--owner-accent)]/20 text-[var(--owner-accent)] font-bold' : 'hover:bg-white/5'}`}
                            onClick={() => setTimeFilter(timeFilter === 'afternoon' ? 'all' : 'afternoon')}
                        >
                            Pomeriggio
                            <div className="text-[10px] opacity-60">12:00-18:00</div>
                        </div>
                        <div
                            className={`text-center p-2 cursor-pointer rounded transition-colors ${timeFilter === 'evening' ? 'bg-[var(--owner-accent)]/20 text-[var(--owner-accent)] font-bold' : 'hover:bg-white/5'}`}
                            onClick={() => setTimeFilter(timeFilter === 'evening' ? 'all' : 'evening')}
                        >
                            Sera
                            <div className="text-[10px] opacity-60">18:00-24:00</div>
                        </div>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: `repeat(${courts.length}, 1fr)` }}>
                        {courts.map(court => {
                            const courtSlots = filterSlotsByTime(slots.filter(s => s.courtId === court.id));
                            return (
                                <div key={court.id} className="border-l border-[var(--owner-border)] min-h-[400px] p-2 space-y-2">
                                    {courtSlots.length === 0 && (
                                        <div className="text-center text-sm py-4 italic opacity-50">Nessuno slot</div>
                                    )}
                                    {courtSlots.map(slot => (
                                        <div
                                            key={slot.id}
                                            onClick={() => handleSlotClick(slot)}
                                            className="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md"
                                            style={{
                                                backgroundColor: slot.type === 'booked' ? 'var(--owner-slot-booked-bg)' : 'var(--owner-slot-avail-bg)',
                                                borderColor: slot.type === 'booked' ? 'var(--owner-slot-booked-border)' : 'var(--owner-slot-avail-border)',
                                                color: slot.type === 'booked' ? 'var(--owner-slot-booked-text)' : 'var(--owner-slot-avail-text)'
                                            }}
                                        >
                                            <div className="font-bold text-sm" style={{ color: 'inherit' }}>
                                                {convertTo24h(slot.start)} - {convertTo24h(slot.end)}
                                            </div>
                                            {slot.type === 'booked' ? (
                                                <div className="text-xs mt-1 flex items-center" style={{ color: 'inherit', opacity: 0.9 }}>
                                                    <User className="w-3 h-3 mr-1" />
                                                    {slot.data.booking_type === 'offline' ? 'Prenotazione Manuale' : 'Online'}
                                                </div>
                                            ) : (
                                                <div className="text-xs mt-1" style={{ color: 'inherit', opacity: 0.8 }}>Disponibile</div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    // Render Week View
    const renderWeekView = () => {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekDays = eachDayOfInterval({
            start: weekStart,
            end: endOfWeek(selectedDate, { weekStartsOn: 1 })
        });

        return (
            <div className="min-w-[800px]">
                <div className="grid grid-cols-7 border-b border-[var(--owner-border)]">
                    {weekDays.map(day => (
                        <div
                            key={day.toISOString()}
                            className={`p-3 text-center border-l border-[var(--owner-border)] first:border-l-0 ${isToday(day) ? 'bg-green-900/30' : ''
                                }`}
                        >
                            <div className="text-xs uppercase opacity-60">{format(day, 'EEE', { locale: it })}</div>
                            <div className={`text-lg font-bold ${isToday(day) ? 'text-green-400' : ''}`}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 min-h-[400px]">
                    {weekDays.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const daySlots = slots.filter(s => s.date === dayStr);
                        const bookedCount = daySlots.filter(s => s.type === 'booked').length;
                        const availCount = daySlots.filter(s => s.type === 'available').length;

                        return (
                            <div
                                key={day.toISOString()}
                                className="border-l border-[var(--owner-border)] first:border-l-0 p-2 cursor-pointer hover:bg-white/5"
                                onClick={() => {
                                    setSelectedDate(day);
                                    setViewMode(VIEW_MODES.DAY);
                                }}
                            >
                                {bookedCount > 0 && (
                                    <div
                                        className="text-xs rounded px-2 py-1 mb-1"
                                        style={{ backgroundColor: 'var(--owner-slot-booked-bg)', border: '1px solid var(--owner-slot-booked-border)', color: 'var(--owner-slot-booked-text)' }}
                                    >
                                        {bookedCount} prenotazioni
                                    </div>
                                )}
                                {availCount > 0 && (
                                    <div
                                        className="text-xs rounded px-2 py-1"
                                        style={{ backgroundColor: 'var(--owner-slot-avail-bg)', border: '1px solid var(--owner-slot-avail-border)', color: 'var(--owner-slot-avail-text)' }}
                                    >
                                        {availCount} disponibili
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render Month View
    const renderMonthView = () => {
        const monthStart = startOfMonth(selectedDate);
        const monthEnd = endOfMonth(selectedDate);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        const days = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div>
                <div className="grid grid-cols-7 border-b border-[var(--owner-border)]">
                    {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
                        <div key={day} className="p-2 text-center text-xs font-semibold uppercase opacity-60">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7">
                    {days.map(day => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const daySlots = slots.filter(s => s.date === dayStr);
                        const bookedCount = daySlots.filter(s => s.type === 'booked').length;
                        const isCurrentMonth = isSameMonth(day, selectedDate);

                        return (
                            <div
                                key={day.toISOString()}
                                onClick={() => {
                                    setSelectedDate(day);
                                    setViewMode(VIEW_MODES.DAY);
                                }}
                                className={`p-2 border border-[var(--owner-border)] min-h-[80px] cursor-pointer hover:bg-white/5 ${!isCurrentMonth ? 'opacity-40' : ''
                                    } ${isToday(day) ? 'bg-green-900/20' : ''}`}
                            >
                                <div className={`text-sm font-medium ${isToday(day) ? 'text-green-400' : ''}`}>
                                    {format(day, 'd')}
                                </div>
                                {bookedCount > 0 && (
                                    <div
                                        className="mt-1 text-xs rounded px-1 py-0.5 text-center"
                                        style={{ backgroundColor: 'var(--owner-slot-booked-bg)', border: '1px solid var(--owner-slot-booked-border)', color: 'var(--owner-slot-booked-text)' }}
                                    >
                                        {bookedCount}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Render Agenda View
    const renderAgendaView = () => {
        const bookedSlots = slots.filter(s => s.type === 'booked');
        const groupedByDate = bookedSlots.reduce((acc, slot) => {
            if (!acc[slot.date]) acc[slot.date] = [];
            acc[slot.date].push(slot);
            return acc;
        }, {});

        return (
            <div className="space-y-4">
                {Object.keys(groupedByDate).length === 0 ? (
                    <div className="text-center py-10 opacity-50">
                        Nessuna prenotazione nel periodo selezionato
                    </div>
                ) : (
                    Object.entries(groupedByDate).map(([date, dateSlots]) => (
                        <div key={date} className="border border-[var(--owner-border)] rounded-lg overflow-hidden">
                            <div className="bg-[var(--owner-bg-secondary)] px-4 py-2 font-semibold">
                                {format(new Date(date), 'EEEE d MMMM yyyy', { locale: it })}
                            </div>
                            <div className="divide-y divide-[var(--owner-border)]">
                                {dateSlots.map(slot => {
                                    const court = courts.find(c => c.id === slot.courtId);
                                    return (
                                        <div key={slot.id} className="px-4 py-3 flex items-center justify-between">
                                            <div>
                                                <div className="font-medium">{slot.start} - {slot.end}</div>
                                                <div className="text-sm opacity-60">{court?.name}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm text-blue-400">
                                                    {slot.data.booking_type === 'offline' ? 'Manuale' : 'Online'}
                                                </div>
                                                {slot.data.player_names && (
                                                    <div className="text-xs opacity-60">
                                                        {slot.data.player_names.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (viewMode) {
            case VIEW_MODES.WEEK:
                return renderWeekView();
            case VIEW_MODES.MONTH:
                return renderMonthView();
            case VIEW_MODES.AGENDA:
                return renderAgendaView();
            default:
                return renderDayView();
        }
    };

    return (
        <div className="owner-section-card">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--owner-border)]">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold flex items-center capitalize">
                        <CalendarIcon className="w-6 h-6 mr-2 text-green-500" />
                        {getHeaderTitle()}
                    </h2>
                </div>

                <div className="flex items-center gap-4">
                    {/* View Mode Buttons */}
                    <div className="flex bg-[var(--owner-bg-primary)] rounded-lg p-1">
                        <button
                            onClick={() => setViewMode(VIEW_MODES.DAY)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === VIEW_MODES.DAY
                                ? 'bg-green-600 text-white'
                                : 'hover:bg-white/10'
                                }`}
                        >
                            Giorno
                        </button>
                        <button
                            onClick={() => setViewMode(VIEW_MODES.WEEK)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === VIEW_MODES.WEEK
                                ? 'bg-green-600 text-white'
                                : 'hover:bg-white/10'
                                }`}
                        >
                            Settimana
                        </button>
                        <button
                            onClick={() => setViewMode(VIEW_MODES.MONTH)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === VIEW_MODES.MONTH
                                ? 'bg-green-600 text-white'
                                : 'hover:bg-white/10'
                                }`}
                        >
                            Mese
                        </button>
                        <button
                            onClick={() => setViewMode(VIEW_MODES.AGENDA)}
                            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === VIEW_MODES.AGENDA
                                ? 'bg-green-600 text-white'
                                : 'hover:bg-white/10'
                                }`}
                        >
                            Agenda
                        </button>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigateDate(-1)}
                            className="p-2 rounded-full hover:bg-white/10 border border-[var(--owner-border)]"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="px-4 py-2 rounded-md hover:bg-white/10 border border-[var(--owner-border)] font-medium"
                        >
                            Oggi
                        </button>
                        <button
                            onClick={() => navigateDate(1)}
                            className="p-2 rounded-full hover:bg-white/10 border border-[var(--owner-border)]"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {loading ? (
                    <div className="text-center py-10 opacity-50">Caricamento...</div>
                ) : (
                    <div className="overflow-x-auto">
                        {renderContent()}
                    </div>
                )}
            </div>

            <NewBookingModal
                isOpen={isModalOpen}
                close={() => setIsModalOpen(false)}
                slot={selectedSlot}
                courtName={selectedSlot ? courts.find(c => c.id === selectedSlot.courtId)?.name : ''}
                onSuccess={fetchCourtsAndSchedule}
            />
        </div>
    );
};

export default BookingCalendar;
