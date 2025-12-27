import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Trash2, Plus, CreditCard } from "lucide-react";

const PromoSettings = () => {
    const { user } = useAuth();
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newCard, setNewCard] = useState({
        name: "",
        credits: "",
        price: ""
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (user) {
            fetchCards();
        }
    }, [user]);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("promo_cards")
                .select("*")
                .eq("owner_id", user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setCards(data || []);
        } catch (error) {
            console.error("Error fetching promo cards:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            setCreating(true);
            if (!newCard.name || !newCard.credits || !newCard.price) return;

            const { data, error } = await supabase
                .from("promo_cards")
                .insert({
                    owner_id: user.id,
                    name: newCard.name,
                    credits: parseInt(newCard.credits),
                    price: parseFloat(newCard.price)
                })
                .select()
                .single();

            if (error) throw error;

            setCards([data, ...cards]);
            setNewCard({ name: "", credits: "", price: "" });
            toast.success("Carta promozionale creata!");
        } catch (error) {
            console.error("Error creating card:", error);
            toast.error("Impossibile creare la carta");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Sei sicuro di voler eliminare questa carta?")) return;
        try {
            const { error } = await supabase
                .from("promo_cards")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setCards(cards.filter(c => c.id !== id));
            toast.success("Carta eliminata");
        } catch (error) {
            console.error("Error deleting card:", error);
            toast.error("Impossibile eliminare");
        }
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <CreditCard className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                        Gestione Carte Promozionali
                    </h2>
                    <p className="text-sm text-[var(--owner-text-muted)]">
                        Crea pacchetti di partite a scalare (es. 10 Ingressi).
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {/* Create Form */}
                <form onSubmit={handleCreate} className="mb-8 p-6 bg-[var(--owner-bg-secondary)] rounded-xl border border-[var(--owner-border)]">
                    <h3 className="text-sm font-bold text-[var(--owner-text-secondary)] mb-4 uppercase tracking-wider">Crea Nuovo Pacchetto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div>
                            <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Nome Pacchetto</label>
                            <input
                                type="text"
                                placeholder="es. Pacchetto 10 Ingressi"
                                className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                value={newCard.name}
                                onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Partite Incluse</label>
                            <input
                                type="number"
                                placeholder="10"
                                className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                value={newCard.credits}
                                onChange={e => setNewCard({ ...newCard, credits: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-[var(--owner-text-secondary)] mb-2 uppercase">Prezzo (€)</label>
                            <input
                                type="number"
                                placeholder="90.00"
                                step="0.01"
                                className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                value={newCard.price}
                                onChange={e => setNewCard({ ...newCard, price: e.target.value })}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={creating}
                            className="bg-[var(--owner-accent)] text-white p-3 rounded-lg hover:bg-[var(--owner-accent-hover)] flex items-center justify-center gap-2 font-bold disabled:opacity-50 transition-colors h-[50px]"
                        >
                            <Plus size={18} />
                            Crea
                        </button>
                    </div>
                </form>

                {/* Existing Cards */}
                <h3 className="text-sm font-bold text-[var(--owner-text-secondary)] mb-4 uppercase tracking-wider">Pacchetti Attivi</h3>
                {loading ? (
                    <p className="text-[var(--owner-text-muted)]">Caricamento...</p>
                ) : cards.length === 0 ? (
                    <div className="text-center py-12 text-[var(--owner-text-muted)] border border-dashed border-[var(--owner-border)] rounded-xl">
                        <CreditCard size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Nessun pacchetto promozionale creato.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cards.map(card => (
                            <div key={card.id} className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6 flex flex-col justify-between hover:border-[var(--owner-accent)] transition-colors relative group">
                                <div>
                                    <h4 className="font-bold text-lg text-[var(--owner-text-primary)] mb-2">{card.name}</h4>
                                    <div className="space-y-2">
                                        <p className="text-[var(--owner-text-secondary)] text-sm flex justify-between">
                                            Partite: <span className="font-bold text-[var(--owner-text-primary)]">{card.credits}</span>
                                        </p>
                                        <p className="text-[var(--owner-text-secondary)] text-sm flex justify-between">
                                            Prezzo: <span className="font-bold text-[var(--owner-accent)]">€{card.price}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-[var(--owner-border)] flex justify-end">
                                    <button
                                        onClick={() => handleDelete(card.id)}
                                        className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors"
                                        title="Elimina Pacchetto"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromoSettings;
