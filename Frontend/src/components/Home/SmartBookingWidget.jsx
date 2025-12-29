import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../Contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import {
    Calendar as CalendarIcon,
    Clock,
    Sun,
    CloudRain,
    User,
    Check,
    ChevronRight,
    ChevronLeft,
    MapPin,
    Info
} from "lucide-react";

import { isAnySlotAvailable, findFirstAvailableCourt } from "../../services/bookingValidation";
import { getWeatherForecast, getWeatherWarning } from "../../services/weatherService";
import { sendTemplateEmail } from "../../services/emailService";

const SmartBookingWidget = () => {
    const { t } = useTranslation();
    const { user, signIn } = useAuth();
    const navigate = useNavigate();

    // --- State ---
    const [step, setStep] = useState(1); // 1: Type, 2: Date/Time, 3: Auth, 4: Confirm
    const [bookingType, setBookingType] = useState(null); // 'indoor' | 'outdoor'
    const [selectedDate, setSelectedDate] = useState("");
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [weather, setWeather] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Auth State for Guest Flow
    const [authMode, setAuthMode] = useState("guest"); // 'guest' | 'login'
    const [guestDetails, setGuestDetails] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: ""
    });
    const [loginDetails, setLoginDetails] = useState({
        email: "",
        password: ""
    });

    // Confirmed booking data
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    // --- Effects ---
    useEffect(() => {
        if (step === 2 && bookingType && selectedDate) {
            fetchSmartSlots();
            fetchWeather();
        }
    }, [selectedDate, bookingType, step]);

    // --- Logic: Fetch Slots ---
    const fetchSmartSlots = async () => {
        if (!selectedDate) return;
        setLoadingSlots(true);
        setAvailableSlots([]);
        setSelectedSlot(null);

        try {
            // 1. Get Club Hours for the day
            const dayOfWeek = new Date(selectedDate).getDay();
            const { data: hoursData } = await supabase
                .from('club_hours')
                .select('*')
                .eq('day_of_week', dayOfWeek)
                .single();

            if (!hoursData || !hoursData.is_open) {
                setLoadingSlots(false);
                return; // Club closed
            }

            // 2. Generate 90-minute slots (standard match duration)
            // Note: In real app, make duration configurable
            const duration = 90;
            const openH = parseInt(hoursData.open_time.split(':')[0]);
            const closeH = parseInt(hoursData.close_time.split(':')[0]);

            const slots = [];
            let currentMin = openH * 60;
            const endMin = closeH * 60;

            // Get current time in minutes and today's date string locally
            const now = new Date();
            const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const todayStr = `${year}-${month}-${day}`;
            const isToday = selectedDate === todayStr;

            while (currentMin + duration <= endMin) {
                // Filter past slots if today
                if (isToday && currentMin < currentTotalMinutes) {
                    currentMin += 30;
                    continue;
                }
                const startH = Math.floor(currentMin / 60);
                const startM = currentMin % 60;
                const endH = Math.floor((currentMin + duration) / 60);
                const endM = (currentMin + duration) % 60;

                const timeStart = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;
                const timeEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

                // 3. Check Smart Availability
                const isIndoor = bookingType === 'indoor';
                const isAvailable = await isAnySlotAvailable(isIndoor, selectedDate, timeStart, timeEnd);

                if (isAvailable) {
                    slots.push({ timeStart, timeEnd });
                }

                currentMin += 30; // 30 min intervals for flexibility
            }

            setAvailableSlots(slots);

        } catch (error) {
            console.error("Error fetching slots:", error);
            toast.error("Errore nel caricamento disponibilità");
        } finally {
            setLoadingSlots(false);
        }
    };

    const fetchWeather = async () => {
        if (bookingType === 'outdoor' && selectedDate) {
            const data = await getWeatherForecast(selectedDate);
            setWeather(data);
        } else {
            setWeather(null);
        }
    };

    // --- Handlers ---
    const handleTypeSelect = (type) => {
        setBookingType(type);
        // Use local date to ensure compatibility with 'isToday' check
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        setSelectedDate(todayStr); // Default to today (local)
        setStep(2);
    };

    const handleSlotSelect = (slot) => {
        setSelectedSlot(slot);
        // If user is already logged in, skip auth step? No, show summary first
        setStep(3);
    };

    const handleGuestSubmit = async (e) => {
        e.preventDefault();
        await processBooking(guestDetails, true);
    };

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data, error } = await signIn({
                email: loginDetails.email,
                password: loginDetails.password
            });
            if (error) throw error;
            // Proceed to book as logged in user
            await processBooking(null, false);
        } catch (error) {
            toast.error("Credenziali non valide");
        }
    };

    const processBooking = async (guestData, isGuest) => {
        const toastId = toast.loading("Elaborazione prenotazione...");

        try {
            let userId = user?.id;

            // 1. Handle Guest Registration
            if (isGuest && !userId) {
                // Generate random password
                const randomPassword = Math.random().toString(36).slice(-8) + "Aa1!";

                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: guestDetails.email,
                    password: randomPassword,
                    options: {
                        data: {
                            first_name: guestDetails.firstName,
                            last_name: guestDetails.lastName,
                            phone: guestDetails.phone
                        }
                    }
                });

                if (authError) throw authError;

                if (authData.user) {
                    userId = authData.user.id;
                    // Send Credentials Email
                    try {
                        // We use our email service to send the generated credentials
                        // Note: user_credentials template must exist
                        await sendTemplateEmail('user_credentials', guestDetails.email, {
                            firstName: guestDetails.firstName,
                            email: guestDetails.email,
                            password: randomPassword,
                            loginUrl: window.location.origin + '/login',
                            clubName: 'The Padel Court'
                        });
                    } catch (emailErr) {
                        console.warn("Failed to send credentials", emailErr);
                    }
                } else {
                    throw new Error("Registrazione ospite non riuscita (email confirmation required?)");
                }
            } else if (!userId) {
                // Should be logged in by now
                throw new Error("Utente non autenticato");
            }

            // 2. Find Available Court
            const isIndoor = bookingType === 'indoor';
            const courtId = await findFirstAvailableCourt(isIndoor, selectedDate, selectedSlot.timeStart, selectedSlot.timeEnd);

            if (!courtId) {
                throw new Error("Spiacenti, lo slot non è più disponibile. Riprova.");
            }

            // 3. Create Booking
            // Fetch price first (simplified)
            const price = 40; // Default or fetch from DB

            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    court_id: courtId,
                    user_id: userId,
                    booking_date: selectedDate,
                    time_slot_start: selectedSlot.timeStart,
                    time_slot_end: selectedSlot.timeEnd,
                    status: 'pending', // Set to pending as requested
                    price: price,
                    is_guest: isGuest // Optional flag if schema supports it
                })
                .select('*, courts(name)')
                .single();

            if (bookingError) throw bookingError;

            // 4. Send "Request Received" Email (Optional, or wait for approval)
            // User said: "avvisa utente che campo verrà approvato il prima possibile... una volta confermato invia email di conferma"
            // So we might NOT send the confirmation email here, but we could send a "Request Received" email if we had a template.
            // For now, simple toast/UI feedback is key. 
            // We WILL trigger an Admin Notification here.

            try {
                await notify.adminNewBookingRequest({
                    courtName: booking.courts?.name,
                    date: selectedDate,
                    time: selectedSlot.timeStart,
                    userName: isGuest ? `${guestData.firstName} ${guestData.lastName}` : user.email
                });
            } catch (err) {
                console.warn("Failed to notify admin", err);
            }

            setConfirmedBooking(booking);
            setStep(4); // Success Step
            toast.success("Richiesta inviata con successo!", { id: toastId });

        } catch (error) {
            console.error(error);
            toast.error(error.message || "Errore durante la prenotazione", { id: toastId });
        }
    };

    // --- Renders ---

    // Step 1: Court Type Selection
    const renderStep1 = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in zoom-in duration-300">
            <div
                onClick={() => handleTypeSelect('indoor')}
                className="group cursor-pointer rounded-3xl bg-white p-8 shadow-[var(--owner-shadow-premium)] hover:shadow-2xl transition-all border-2 border-transparent hover:border-[var(--owner-accent)] relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Check size={120} />
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-[var(--owner-accent)]">
                        <div style={{ fontSize: '40px' }}>🏠</div>
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--owner-text-primary)] mb-2">Indoor Padel</h3>
                    <p className="text-[var(--owner-text-secondary)]">Campi al coperto climatizzati. Ideale per ogni condizione.</p>
                </div>
            </div>

            <div
                onClick={() => handleTypeSelect('outdoor')}
                className="group cursor-pointer rounded-3xl bg-white p-8 shadow-[var(--owner-shadow-premium)] hover:shadow-2xl transition-all border-2 border-transparent hover:border-orange-500 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Sun size={120} className="text-orange-500" />
                </div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform text-orange-500">
                        <Sun size={40} />
                    </div>
                    <h3 className="text-2xl font-bold text-[var(--owner-text-primary)] mb-2">Outdoor Padel</h3>
                    <p className="text-[var(--owner-text-secondary)]">Campi all'aperto panoramici. Goditi il sole e l'aria fresca.</p>
                </div>
            </div>
        </div>
    );

    // Step 2: Date & Time
    const renderStep2 = () => (
        <div className="animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <ChevronLeft />
                </button>
                <h2 className="text-2xl font-bold text-[var(--owner-text-primary)]">
                    Seleziona Data e Orario ({bookingType === 'indoor' ? 'Indoor' : 'Outdoor'})
                </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Col: Calendar & Weather */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-3xl shadow-[var(--owner-shadow-soft)]">
                        <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Data</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`}
                            className="w-full p-3 rounded-xl border border-gray-200 focus:border-[var(--owner-accent)] outline-none font-medium"
                        />
                    </div>

                    {/* Weather Widget */}
                    {weather && (
                        <div className={`p-6 rounded-3xl text-white shadow-lg ${weather.condition === 'rain' ? 'bg-gradient-to-br from-gray-500 to-gray-700' : 'bg-gradient-to-br from-blue-400 to-blue-600'}`}>
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold opacity-90">Meteo Previsto</span>
                                <Sun className="animate-pulse" />
                            </div>
                            <div className="text-4xl font-bold mb-1">{weather.temp}°</div>
                            <div className="text-sm opacity-90 capitalize">{weather.description}</div>

                            {/* Warning if bad weather */}
                            {!isWeatherSuitable(weather) && (
                                <div className="mt-4 bg-white/20 p-3 rounded-xl text-sm backdrop-blur-sm flex items-start gap-2">
                                    <Info size={16} className="mt-0.5" />
                                    <span>Attenzione: Condizioni meteo avverse possibili.</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Legend */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm text-sm text-[var(--owner-text-secondary)]">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div> Disponibile
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-gray-200"></div> Occupato
                        </div>
                    </div>
                </div>

                {/* Right Col: Slots */}
                <div className="lg:col-span-2">
                    {loadingSlots ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-[var(--owner-accent)] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : availableSlots.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-[var(--owner-text-secondary)] bg-white rounded-3xl border border-dashed border-gray-300">
                            <CalendarIcon size={48} className="mb-4 opacity-20" />
                            <p>Nessuno slot disponibile per questa data.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {availableSlots.map((slot, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSlotSelect(slot)}
                                    className="group relative p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[var(--owner-accent)] transition-all text-center"
                                >
                                    <span className="block text-lg font-bold text-[var(--owner-text-primary)] group-hover:text-[var(--owner-accent)]">
                                        {slot.timeStart}
                                    </span>
                                    <span className="text-xs text-[var(--owner-text-secondary)]">
                                        fino alle {slot.timeEnd}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // Step 3: Auth / Details
    const renderStep3 = () => (
        <div className="max-w-2xl mx-auto animate-in slide-in-from-right duration-300">
            <button onClick={() => setStep(2)} className="mb-6 flex items-center gap-2 text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)]">
                <ChevronLeft size={16} /> Torna indietro
            </button>

            <div className="bg-white p-8 rounded-3xl shadow-[var(--owner-shadow-premium)]">
                <h2 className="text-2xl font-bold mb-6 text-center">Completa la prenotazione</h2>

                {/* Booking Summary */}
                <div className="bg-[var(--owner-bg-primary)] p-4 rounded-xl mb-8 flex items-center justify-between">
                    <div>
                        <div className="text-sm text-[var(--owner-text-secondary)]">Data e Ora</div>
                        <div className="font-bold text-[var(--owner-text-primary)]">
                            {selectedDate} • {selectedSlot?.timeStart}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-[var(--owner-text-secondary)]">Tipo</div>
                        <div className="font-bold capitalize text-[var(--owner-accent)]">{bookingType}</div>
                    </div>
                </div>

                {/* Auth Toggle */}
                {!user && (
                    <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
                        <button
                            onClick={() => setAuthMode('guest')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'guest' ? 'bg-white shadow text-[var(--owner-text-primary)]' : 'text-gray-500'}`}
                        >
                            Continua come Ospite
                        </button>
                        <button
                            onClick={() => setAuthMode('login')}
                            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-white shadow text-[var(--owner-text-primary)]' : 'text-gray-500'}`}
                        >
                            Accedi
                        </button>
                    </div>
                )}

                {/* Forms */}
                {user ? (
                    // Already Logged In
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--owner-accent)]">
                            <User size={32} />
                        </div>
                        <p className="mb-6">Prenota come <strong>{user.email}</strong></p>
                        <button
                            onClick={() => processBooking(null, false)}
                            className="w-full py-4 rounded-xl bg-[var(--owner-accent)] text-white font-bold hover:bg-[var(--owner-accent-hover)] transition-all shadow-lg shadow-blue-500/30"
                        >
                            Conferma Prenotazione
                        </button>
                    </div>
                ) : authMode === 'guest' ? (
                    // Guest Form
                    <form onSubmit={handleGuestSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nome</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all"
                                    value={guestDetails.firstName}
                                    onChange={e => setGuestDetails({ ...guestDetails, firstName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Cognome</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all"
                                    value={guestDetails.lastName}
                                    onChange={e => setGuestDetails({ ...guestDetails, lastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all"
                                value={guestDetails.email}
                                onChange={e => setGuestDetails({ ...guestDetails, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Telefono</label>
                            <input
                                required
                                type="tel"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all"
                                value={guestDetails.phone}
                                onChange={e => setGuestDetails({ ...guestDetails, phone: e.target.value })}
                            />
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                            * Verrà creato automaticamente un account per le tue future prenotazioni. Le credenziali ti verranno inviate via email.
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 mt-4 rounded-xl bg-[var(--owner-accent)] text-white font-bold hover:bg-[var(--owner-accent-hover)] transition-all shadow-lg shadow-blue-500/30"
                        >
                            Conferma e Prenota
                        </button>
                    </form>
                ) : (
                    // Login Form
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all"
                                value={loginDetails.email}
                                onChange={e => setLoginDetails({ ...loginDetails, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                required
                                type="password"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all"
                                value={loginDetails.password}
                                onChange={e => setLoginDetails({ ...loginDetails, password: e.target.value })}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-4 mt-4 rounded-xl bg-[var(--owner-accent)] text-white font-bold hover:bg-[var(--owner-accent-hover)] transition-all shadow-lg shadow-blue-500/30"
                        >
                            Accedi e Prenota
                        </button>
                    </form>
                )}
            </div>
        </div>
    );

    // Step 4: Success
    const renderStep4 = () => (
        <div className="text-center max-w-lg mx-auto py-12 animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <Check size={48} strokeWidth={4} />
            </div>
            <h2 className="text-3xl font-bold text-[var(--owner-text-primary)] mb-4">Prenotazione Confermata!</h2>
            <p className="text-[var(--owner-text-secondary)] mb-8">
                Grazie per aver prenotato. Abbiamo inviato una email di conferma con tutti i dettagli e le indicazioni per raggiungerci.
            </p>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 max-w-sm mx-auto">
                <div className="text-sm text-gray-400 mb-1">Campo Assegnato</div>
                <div className="text-xl font-bold text-[var(--owner-text-primary)] mb-2">
                    {confirmedBooking?.courts?.name || 'Campo Standard'}
                </div>
                <div className="text-sm text-gray-400 mb-1">Orario</div>
                <div className="text-lg font-medium text-[var(--owner-accent)]">
                    {selectedDate} • {selectedSlot?.timeStart}
                </div>
            </div>

            <button
                onClick={() => {
                    setStep(1);
                    setConfirmedBooking(null);
                }}
                className="px-8 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[var(--owner-text-primary)] font-bold transition-colors"
            >
                Nuova Prenotazione
            </button>
        </div>
    );

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
        </div>
    );
};

// Helper for weather check
const isWeatherSuitable = (weather) => {
    return !['rain', 'thunderstorm', 'snow'].includes(weather.condition);
};

export default SmartBookingWidget;
