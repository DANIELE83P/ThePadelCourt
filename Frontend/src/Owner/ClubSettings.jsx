import React, { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { toast } from "react-hot-toast";

const ClubSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        address: "",
        phone: "",
        email: "",
        hours_week: "",
        hours_weekend: "",
        map_url: ""
    });

    useEffect(() => {
        if (user) {
            fetchClubProfile();
        }
    }, [user]);

    const fetchClubProfile = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("club_profiles")
                .select("*")
                .eq("owner_id", user.id)
                .single();

            if (error && error.code !== "PGRST116") {
                throw error;
            }

            if (data) {
                setFormData({
                    address: data.address || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    hours_week: data.hours_week || "",
                    hours_weekend: data.hours_weekend || "",
                    map_url: data.map_url || ""
                });
            }
        } catch (error) {
            console.error("Error fetching club profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            const updates = {
                owner_id: user.id,
                ...formData,
                updated_at: new Date()
            };

            const { error } = await supabase
                .from("club_profiles")
                .upsert(updates, { onConflict: "owner_id" });

            if (error) throw error;
            toast.success("Impostazioni salvate con successo!");
        } catch (error) {
            console.error("Error updating club profile:", error);
            toast.error("Errore nel salvataggio");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-center">Caricamento impostazioni...</div>;

    return (
        <div className="owner-section-card">
            <div className="owner-section-card-header">
                Informazioni Club
            </div>
            <form onSubmit={handleSubmit} className="owner-section-card-body space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Contatti */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Indirizzo</label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Via Roma 123, Milano"
                            className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Telefono</label>
                        <input
                            type="text"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+39 123 456 7890"
                            className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="info@tuoclub.it"
                            className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">URL Mappa Google</label>
                        <input
                            type="text"
                            name="map_url"
                            value={formData.map_url}
                            onChange={handleChange}
                            placeholder="https://www.google.com/maps/embed?..."
                            className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="border-t border-[var(--owner-border)] pt-4">
                    <h3 className="text-lg font-medium mb-4">Orari di Apertura</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Giorni Feriali</label>
                            <input
                                type="text"
                                name="hours_week"
                                value={formData.hours_week}
                                onChange={handleChange}
                                placeholder="09:00 - 23:00"
                                className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Weekend</label>
                            <input
                                type="text"
                                name="hours_weekend"
                                value={formData.hours_weekend}
                                onChange={handleChange}
                                placeholder="08:00 - 22:00"
                                className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                        {saving ? "Salvataggio..." : "Salva Impostazioni"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClubSettings;
