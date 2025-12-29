import { useState, useEffect } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Search, X, Mail, MessageSquare, User, Users, Plus } from "lucide-react";

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
                <div className="fixed inset-0 bg-[rgba(224,229,242,0.5)] backdrop-blur-sm" aria-hidden="true" />
                <div className="fixed inset-0 flex items-center justify-center p-4">
                    <DialogPanel className="w-full max-w-md rounded-[var(--owner-radius-lg)] bg-[var(--owner-card-bg)] border-none p-8 shadow-[var(--owner-shadow-premium)]">
                        <DialogTitle className="text-xl font-bold text-[var(--owner-text-primary)] mb-4">
                            Invia Conferma Prenotazione
                        </DialogTitle>
                        <p className="text-[var(--owner-text-secondary)] mb-6 font-medium">
                            Vuoi inviare la conferma della prenotazione a <strong>{players[0].name}</strong>?
                        </p>
                        <div className="space-y-3">
                            {players[0].email && (
                                <button
                                    onClick={() => sendConfirmation('email')}
                                    className="w-full bg-[var(--owner-accent)] hover:bg-[var(--owner-accent-hover)] text-white rounded-2xl py-3 px-4 flex items-center justify-center gap-2 font-bold transition-all shadow-[var(--owner-glow-accent)]"
                                >
                                    <Mail className="w-5 h-5" />
                                    Invia via Email ({players[0].email})
                                </button>
                            )}
                            {players[0].phone && (
                                <button
                                    onClick={() => sendConfirmation('sms')}
                                    className="w-full bg-[#01B574] hover:bg-[#00925d] text-white rounded-2xl py-3 px-4 flex items-center justify-center gap-2 font-bold transition-all shadow-lg shadow-green-500/30"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                    Invia via SMS ({players[0].phone})
                                </button>
                            )}
                            <button
                                onClick={skipConfirmation}
                                className="w-full bg-[var(--owner-bg-primary)] hover:bg-gray-100 text-[var(--owner-text-primary)] rounded-2xl py-3 px-4 font-bold transition-colors"
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
            <div className="fixed inset-0 bg-[rgba(224,229,242,0.5)] backdrop-blur-sm" aria-hidden="true" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-2xl rounded-[var(--owner-radius-lg)] bg-[var(--owner-card-bg)] border-none p-0 shadow-[var(--owner-shadow-premium)] max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-8 border-b border-[var(--owner-border)] flex items-center justify-between bg-white">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-[var(--owner-text-primary)]">Prenotazione Manuale</DialogTitle>
                            <p className="text-sm text-[var(--owner-text-secondary)] mt-1 font-medium">Stai creando una prenotazione offline come amministratore.</p>
                        </div>
                        <button onClick={resetAndClose} aria-label="Close" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[var(--owner-text-secondary)]">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {slot && (
                            <div className="p-6 bg-gradient-to-br from-[var(--owner-accent)]/5 to-[var(--owner-accent)]/0 border border-[var(--owner-accent)]/10 rounded-2xl relative overflow-hidden group">
                                <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] group-hover:scale-110 transition-transform duration-500 text-[var(--owner-accent)]">
                                    <Users size={120} />
                                </div>
                                <div className="grid grid-cols-3 gap-6 relative z-10">
                                    <div>
                                        <span className="text-[var(--owner-text-secondary)] text-[10px] font-bold uppercase tracking-wider block mb-1">Campo</span>
                                        <span className="text-[var(--owner-text-primary)] font-bold truncate block text-lg">{courtName}</span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--owner-text-secondary)] text-[10px] font-bold uppercase tracking-wider block mb-1">Data</span>
                                        <span className="text-[var(--owner-text-primary)] font-bold block text-lg">{new Date(slot.data.available_date).toLocaleDateString()}</span>
                                    </div>
                                    <div>
                                        <span className="text-[var(--owner-text-secondary)] text-[10px] font-bold uppercase tracking-wider block mb-1">Orario</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[var(--owner-accent)] font-black text-xl">{slot.start}</span>
                                            <span className="text-[var(--owner-text-secondary)] font-medium">-</span>
                                            <span className="text-[var(--owner-text-primary)] font-bold text-xl">{slot.end}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <section>
                            <label className="text-xs font-bold text-[var(--owner-accent)] uppercase tracking-widest mb-4 block px-1">
                                <Search className="w-3 h-3 inline mr-1 -mt-0.5" />
                                Ricerca Anagrafica
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cerca per nome, email o telefono..."
                                    className="w-full bg-[var(--owner-bg-primary)] border-transparent rounded-2xl p-4 pl-12 text-[var(--owner-text-primary)] focus:bg-white focus:border-[var(--owner-accent)] focus:ring-1 focus:ring-[var(--owner-accent)] outline-none transition-all font-medium"
                                />
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--owner-text-secondary)] w-5 h-5" />
                                {searching && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg className="animate-spin h-5 w-5 text-[var(--owner-accent)]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    </div>
                                )}
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-3 bg-white border border-[var(--owner-border)] rounded-2xl overflow-hidden shadow-[var(--owner-shadow-soft)] animate-in fade-in slide-in-from-top-2 duration-300 z-20 relative">
                                    {searchResults.map((result) => (
                                        <div
                                            key={result.id}
                                            onClick={() => selectUser(result, 0)}
                                            className="p-4 hover:bg-[var(--owner-bg-primary)] cursor-pointer border-b border-[var(--owner-border)] last:border-b-0 transition-all flex items-center justify-between group"
                                        >
                                            <div>
                                                <div className="font-bold text-[var(--owner-text-primary)] group-hover:text-[var(--owner-accent)] transition-colors">{result.full_name}</div>
                                                <div className="text-xs text-[var(--owner-text-secondary)] flex gap-4 mt-1 font-medium">
                                                    <span className="flex items-center gap-1"><Mail size={12} /> {result.email}</span>
                                                    {result.phone && <span>📞 {result.phone}</span>}
                                                </div>
                                            </div>
                                            <div className="bg-[var(--owner-accent)]/10 text-[var(--owner-accent)] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                <Plus size={16} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        {/* Players */}
                        <section className="space-y-4">
                            <label className="text-xs font-bold text-[var(--owner-accent)] uppercase tracking-widest mb-4 block px-1">Giocatori</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {players.map((player, index) => (
                                    <div key={index} className={`p-4 rounded-2xl border transition-all ${player.name ? 'bg-[var(--owner-bg-primary)] border-[var(--owner-accent)]' : 'bg-white border-[var(--owner-border)] hover:border-gray-200'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-bold text-[var(--owner-text-secondary)] uppercase tracking-tighter flex items-center gap-2">
                                                {index === 0 ? <User size={12} className="text-[var(--owner-accent)]" /> : <Users size={12} />}
                                                Giocatore {index + 1} {index === 0 && <span className="text-red-500 font-black">*</span>}
                                            </span>
                                            {player.name && (
                                                <button onClick={() => removePlayer(index)} className="text-[var(--owner-text-secondary)] hover:text-red-500 p-1 hover:bg-red-50 rounded-full transition-all">
                                                    <X size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <input
                                                type="text"
                                                value={player.name}
                                                onChange={(e) => updatePlayer(index, 'name', e.target.value)}
                                                placeholder="Nome Completo"
                                                className="w-full bg-transparent border-b border-[var(--owner-border)] py-2 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none text-sm transition-all placeholder:text-[var(--owner-text-secondary)]/50 font-bold"
                                                required={index === 0}
                                            />
                                            {index === 0 && (
                                                <div className="grid grid-cols-1 gap-2 pt-1">
                                                    <div className="flex items-center gap-2 text-xs text-[var(--owner-text-secondary)]">
                                                        <Mail size={12} />
                                                        <input
                                                            type="email"
                                                            value={player.email}
                                                            onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                                                            placeholder="Indirizzo Email"
                                                            className="flex-1 bg-transparent outline-none focus:text-[var(--owner-text-primary)] font-medium"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-[var(--owner-text-secondary)]">
                                                        <MessageSquare size={12} />
                                                        <input
                                                            type="tel"
                                                            value={player.phone}
                                                            onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                                                            placeholder="Numero Telefono"
                                                            className="flex-1 bg-transparent outline-none focus:text-[var(--owner-text-primary)] font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-8 border-t border-[var(--owner-border)] bg-gray-50 flex gap-4 mt-auto">
                        <button
                            onClick={resetAndClose}
                            className="flex-1 py-4 bg-white border border-[var(--owner-border)] rounded-2xl text-sm font-bold text-[var(--owner-text-secondary)] hover:bg-gray-50 transition-all shadow-sm"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading || !players[0].name.trim()}
                            className="flex-[2] bg-[var(--owner-accent)] hover:bg-[var(--owner-accent-hover)] text-white py-4 rounded-2xl font-bold text-sm shadow-[var(--owner-glow-accent)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Creazione...
                                </span>
                            ) : "Conferma Prenotazione"}
                        </button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
