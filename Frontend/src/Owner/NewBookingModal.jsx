import { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Search, X, Mail, MessageSquare, User, Users } from "lucide-react";

export default function NewBookingModal({ isOpen, close, slot, courtName, onSuccess }) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [players, setPlayers] = useState([
        { name: "", email: "", phone: "", userId: null },
        { name: "", email: "", phone: "", userId: null },
        { name: "", email: "", phone: "", userId: null },
        { name: "", email: "", phone: "", userId: null }
    ]);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [bookingId, setBookingId] = useState(null);

    // Search users in database
    const searchUsers = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        try {
            setSearching(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone')
                .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
                .limit(5);

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error("Error searching users:", error);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            searchUsers(searchQuery);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const selectUser = (userProfile, playerIndex) => {
        const newPlayers = [...players];
        newPlayers[playerIndex] = {
            name: userProfile.full_name || "",
            email: userProfile.email || "",
            phone: userProfile.phone || "",
            userId: userProfile.id
        };
        setPlayers(newPlayers);
        setSearchQuery("");
        setSearchResults([]);
    };

    const updatePlayer = (index, field, value) => {
        const newPlayers = [...players];
        newPlayers[index][field] = value;
        newPlayers[index].userId = null; // Reset userId if manually editing
        setPlayers(newPlayers);
    };

    const removePlayer = (index) => {
        const newPlayers = [...players];
        newPlayers[index] = { name: "", email: "", phone: "", userId: null };
        setPlayers(newPlayers);
    };

    const handleConfirm = async () => {
        if (!players[0].name.trim()) {
            toast.error("Il nome del primo giocatore è obbligatorio");
            return;
        }

        try {
            setLoading(true);

            // Prepare player names array (only non-empty names)
            const playerNames = players
                .filter(p => p.name.trim())
                .map(p => p.name.trim());

            // Create offline booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    court_id: slot.courtId,
                    user_id: players[0].userId || user.id,
                    booking_date: slot.data.available_date,
                    time_slot_start: slot.start,
                    time_slot_end: slot.end,
                    status: 'Confirmed',
                    booking_type: 'offline',
                    player_names: playerNames,
                    contact_email: players[0].email || null,
                    contact_phone: players[0].phone || null
                })
                .select()
                .single();

            if (bookingError) throw bookingError;

            // Mark availability as false
            const { error: updateError } = await supabase
                .from('court_availability')
                .update({ is_available: false })
                .eq('id', slot.data.id);

            if (updateError) {
                // Rollback
                await supabase.from('bookings').delete().eq('id', booking.id);
                throw updateError;
            }

            setBookingId(booking.id);

            // Show confirmation dialog if email or phone is provided
            if (players[0].email || players[0].phone) {
                setShowConfirmation(true);
            } else {
                toast.success("Prenotazione creata con successo!");
                resetAndClose();
                onSuccess();
            }

        } catch (error) {
            console.error("Error creating manual booking:", error);
            toast.error(error.message || "Errore nella creazione della prenotazione");
        } finally {
            setLoading(false);
        }
    };

    const sendConfirmation = async (method) => {
        try {
            if (method === 'email' && players[0].email) {
                // TODO: Implement email sending logic
                toast.success("Conferma inviata via email!");
            } else if (method === 'sms' && players[0].phone) {
                // TODO: Implement SMS sending logic
                toast.success("Conferma inviata via SMS!");
            }
            resetAndClose();
            onSuccess();
        } catch (error) {
            console.error("Error sending confirmation:", error);
            toast.error("Errore nell'invio della conferma");
        }
    };

    const skipConfirmation = () => {
        toast.success("Prenotazione creata con successo!");
        resetAndClose();
        onSuccess();
    };

    const resetAndClose = () => {
        setPlayers([
            { name: "", email: "", phone: "", userId: null },
            { name: "", email: "", phone: "", userId: null },
            { name: "", email: "", phone: "", userId: null },
            { name: "", email: "", phone: "", userId: null }
        ]);
        setSearchQuery("");
        setSearchResults([]);
        setShowConfirmation(false);
        setBookingId(null);
        close();
    };

    if (showConfirmation) {
        return (
            <Dialog open={isOpen} onClose={() => { }} className="relative z-50">
                <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-xl bg-[var(--owner-card-bg)] border border-[var(--owner-border)] p-6 shadow-2xl">
                        <DialogTitle className="text-xl font-bold text-[var(--owner-text-primary)] mb-4">
                            Invia Conferma Prenotazione
                        </DialogTitle>
                        <p className="text-[var(--owner-text-secondary)] mb-6">
                            Vuoi inviare la conferma della prenotazione a <strong>{players[0].name}</strong>?
                        </p>
                        <div className="space-y-3">
                            {players[0].email && (
                                <button
                                    onClick={() => sendConfirmation('email')}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
                                >
                                    <Mail className="w-5 h-5" />
                                    Invia via Email ({players[0].email})
                                </button>
                            )}
                            {players[0].phone && (
                                <button
                                    onClick={() => sendConfirmation('sms')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 font-medium transition-colors"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Invia via SMS ({players[0].phone})
                                </button>
                            )}
                            <button
                                onClick={skipConfirmation}
                                className="w-full bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-bg-primary)] text-[var(--owner-text-primary)] border border-[var(--owner-border)] rounded-lg py-3 px-4 font-medium transition-colors"
                            >
                                Salta, Non Inviare
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </Dialog>
        );
    }

    return (
        <Dialog open={isOpen} onClose={resetAndClose} className="relative z-50">
            <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-2xl rounded-xl bg-[var(--owner-card-bg)] border border-[var(--owner-border)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                    <DialogTitle className="text-2xl font-bold text-[var(--owner-text-primary)] mb-2">
                        Prenotazione Manuale
                    </DialogTitle>

                    {slot && (
                        <div className="mb-6 p-4 bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] rounded-lg">
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-[var(--owner-text-muted)] block mb-1">Campo</span>
                                    <span className="text-[var(--owner-text-primary)] font-semibold">{courtName}</span>
                                </div>
                                <div>
                                    <span className="text-[var(--owner-text-muted)] block mb-1">Data</span>
                                    <span className="text-[var(--owner-text-primary)] font-semibold">{slot.data.available_date}</span>
                                </div>
                                <div>
                                    <span className="text-[var(--owner-text-muted)] block mb-1">Orario</span>
                                    <span className="text-[var(--owner-text-primary)] font-semibold">{slot.start} - {slot.end}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Search Bar */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-[var(--owner-text-secondary)] mb-2 uppercase tracking-wide">
                            <Search className="w-4 h-4 inline mr-1" />
                            Cerca Giocatore in Anagrafica
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cerca per nome o email..."
                                className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                            />
                            {searching && (
                                <div className="absolute right-3 top-3 text-[var(--owner-text-muted)]">
                                    Ricerca...
                                </div>
                            )}
                        </div>
                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] rounded-lg overflow-hidden">
                                {searchResults.map((result, idx) => (
                                    <div
                                        key={result.id}
                                        onClick={() => selectUser(result, 0)}
                                        className="p-3 hover:bg-[var(--owner-accent)]/10 cursor-pointer border-b border-[var(--owner-border)] last:border-b-0 transition-colors"
                                    >
                                        <div className="font-semibold text-[var(--owner-text-primary)]">{result.full_name}</div>
                                        <div className="text-sm text-[var(--owner-text-muted)]">{result.email}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Players */}
                    <div className="space-y-4 mb-6">
                        {players.map((player, index) => (
                            <div key={index} className="p-4 bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] rounded-lg">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase tracking-wide flex items-center gap-2">
                                        {index === 0 ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                                        Giocatore {index + 1} {index === 0 && <span className="text-red-500">*</span>}
                                    </label>
                                    {index > 0 && player.name && (
                                        <button
                                            onClick={() => removePlayer(index)}
                                            className="text-red-500 hover:text-red-400 p-1"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <input
                                        type="text"
                                        value={player.name}
                                        onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                                        placeholder="Nome Cognome"
                                        className="bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-2 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                        required={index === 0}
                                    />
                                    {index === 0 && (
                                        <>
                                            <input
                                                type="email"
                                                value={player.email}
                                                onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                                                placeholder="Email (opzionale)"
                                                className="bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-2 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                            />
                                            <input
                                                type="tel"
                                                value={player.phone}
                                                onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                                                placeholder="Telefono (opzionale)"
                                                className="bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-2 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                            />
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={resetAndClose}
                            className="px-6 py-2.5 text-[var(--owner-text-secondary)] hover:bg-[var(--owner-bg-secondary)] rounded-lg font-medium transition-colors"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading || !players[0].name.trim()}
                            className="bg-[var(--owner-accent)] hover:bg-[var(--owner-accent-hover)] text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {loading ? "Creazione..." : "Conferma Prenotazione"}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
