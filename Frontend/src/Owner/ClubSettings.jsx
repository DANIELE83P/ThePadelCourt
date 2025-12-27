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
        map_url: "",
        city: "",
        country: ""
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
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setFormData({
                    address: data.address || "",
                    phone: data.phone || "",
                    email: data.email || "",
                    map_url: data.map_url || "",
                    city: data.city || "",
                    country: data.country || ""
                });
            }
        } catch (error) {
            console.error("Error fetching club profile:", error);
            toast.error("Errore nel caricamento del profilo");
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
            toast.error(`Errore nel salvataggio: ${error.message || error.details || "Errore sconosciuto"}`);
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
                    <div>
                        <label className="block text-sm font-medium mb-1">Città</label>
                        <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            placeholder="Milano"
                            className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Paese</label>
                        <input
                            type="text"
                            name="country"
                            value={formData.country}
                            onChange={handleChange}
                            placeholder="Italia"
                            className="w-full rounded-md p-2 border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] focus:border-green-500 focus:ring-1 focus:ring-green-500"
                        />
                    </div>
                </div>

                <div className="text-sm text-[var(--owner-text-muted)] mt-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p><strong>📍 Nota:</strong> Gli orari di apertura sono ora gestiti nella sezione <strong>Impostazioni → Orari Apertura</strong></p>
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
