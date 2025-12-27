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
            toast.success("Promo card created!");
        } catch (error) {
            console.error("Error creating card:", error);
            toast.error("Failed to create card");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this card?")) return;
        try {
            const { error } = await supabase
                .from("promo_cards")
                .delete()
                .eq("id", id);

            if (error) throw error;
            setCards(cards.filter(c => c.id !== id));
            toast.success("Card deleted");
        } catch (error) {
            console.error("Error deleting card:", error);
            toast.error("Failed to delete");
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CreditCard className="text-green-600" />
                Manage Promo Cards
            </h2>

            {/* Create Form */}
            <form onSubmit={handleCreate} className="mb-8 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Create New Package</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Card Name</label>
                        <input
                            type="text"
                            placeholder="e.g. 10 Match Pack"
                            className="w-full border rounded p-2"
                            value={newCard.name}
                            onChange={e => setNewCard({ ...newCard, name: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Credits (or Hours)</label>
                        <input
                            type="number"
                            placeholder="10"
                            className="w-full border rounded p-2"
                            value={newCard.credits}
                            onChange={e => setNewCard({ ...newCard, credits: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-600 mb-1">Price (€)</label>
                        <input
                            type="number"
                            placeholder="90.00"
                            step="0.01"
                            className="w-full border rounded p-2"
                            value={newCard.price}
                            onChange={e => setNewCard({ ...newCard, price: e.target.value })}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={creating}
                        className="bg-green-600 text-white p-2 rounded hover:bg-green-700 flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                    >
                        <Plus size={18} />
                        Create
                    </button>
                </div>
            </form>

            {/* Existing Cards */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Active Packages</h3>
            {loading ? (
                <p>Loading...</p>
            ) : cards.length === 0 ? (
                <p className="text-gray-500 italic">No promo cards created yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cards.map(card => (
                        <div key={card.id} className="border rounded-lg p-4 flex flex-col justify-between hover:shadow-md transition-shadow relative bg-gradient-to-br from-white to-gray-50">
                            <div>
                                <h4 className="font-bold text-lg text-gray-800">{card.name}</h4>
                                <div className="mt-2 space-y-1">
                                    <p className="text-gray-600">Credits: <span className="font-semibold text-black">{card.credits}</span></p>
                                    <p className="text-gray-600">Price: <span className="font-semibold text-green-600">€{card.price}</span></p>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t flex justify-end">
                                <button
                                    onClick={() => handleDelete(card.id)}
                                    className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                    title="Delete Package"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PromoSettings;
