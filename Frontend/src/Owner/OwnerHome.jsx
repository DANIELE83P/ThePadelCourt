import React, { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext";
import { supabase } from "../lib/supabase";
import {
    Building2,
    Calendar,
    CalendarCheck,
    TrendingUp,
    Plus,
    ArrowRight
} from "lucide-react";
import { format } from "date-fns";

const OwnerHome = ({ onNavigate }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalCourts: 0,
        todayBookings: 0,
        availableSlots: 0,
        weekBookings: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchStats();
    }, [user]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const today = format(new Date(), "yyyy-MM-dd");

            // Get courts
            const { data: courts, error: courtsError } = await supabase
                .from("courts")
                .select("id")
                .eq("owner_id", user.id);

            if (courtsError) throw courtsError;

            const courtIds = courts?.map((c) => c.id) || [];
            let todayBookings = 0;
            let availableSlots = 0;

            if (courtIds.length > 0) {
                // Today's bookings
                const { count: bookingsCount } = await supabase
                    .from("bookings")
                    .select("*", { count: "exact", head: true })
                    .in("court_id", courtIds)
                    .eq("booking_date", today);

                todayBookings = bookingsCount || 0;

                // Available slots today
                const { count: slotsCount } = await supabase
                    .from("court_availability")
                    .select("*", { count: "exact", head: true })
                    .in("court_id", courtIds)
                    .eq("available_date", today)
                    .eq("is_available", true);

                availableSlots = slotsCount || 0;
            }

            setStats({
                totalCourts: courts?.length || 0,
                todayBookings,
                availableSlots,
                weekBookings: 0 // Placeholder for future
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const statsCards = [
        {
            label: "Campi Totali",
            value: stats.totalCourts,
            icon: Building2,
            color: "green"
        },
        {
            label: "Prenotazioni Oggi",
            value: stats.todayBookings,
            icon: CalendarCheck,
            color: "blue"
        },
        {
            label: "Slot Disponibili Oggi",
            value: stats.availableSlots,
            icon: Calendar,
            color: "purple"
        }
    ];

    const quickActions = [
        {
            label: "Vai al Calendario",
            icon: Calendar,
            action: () => onNavigate("calendar")
        },
        {
            label: "Prenota Campo",
            icon: Building2,
            action: () => onNavigate("courts")
        },
        {
            label: "Promo Cards",
            icon: Plus,
            action: () => onNavigate("promo")
        },
        {
            label: "Impostazioni Club",
            icon: TrendingUp,
            action: () => onNavigate("settings")
        }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-[var(--owner-text-muted)]">Caricamento...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome Message */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-[var(--owner-text-primary)] mb-2">
                    Benvenuto nel tuo Dashboard! 👋
                </h2>
                <p className="text-[var(--owner-text-muted)]">
                    Ecco una panoramica delle tue attività di oggi, {format(new Date(), "d MMMM yyyy")}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="owner-stats-grid">
                {statsCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="owner-stat-card">
                            <div className="owner-stat-card-icon">
                                <Icon />
                            </div>
                            <div className="owner-stat-card-value">{stat.value}</div>
                            <div className="owner-stat-card-label">{stat.label}</div>
                        </div>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-semibold text-[var(--owner-text-primary)] mb-4">
                    Azioni Rapide
                </h3>
                <div className="owner-quick-actions">
                    {quickActions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <div
                                key={index}
                                className="owner-quick-action"
                                onClick={action.action}
                            >
                                <div className="owner-quick-action-icon">
                                    <Icon />
                                </div>
                                <span className="owner-quick-action-text">{action.label}</span>
                                <ArrowRight
                                    size={16}
                                    className="ml-auto text-[var(--owner-text-muted)]"
                                />
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div className="owner-section-card">
                <div className="owner-section-card-header">
                    Attività Recenti
                </div>
                <div className="owner-section-card-body">
                    <div className="text-center py-8 text-[var(--owner-text-muted)]">
                        <CalendarCheck size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Le prenotazioni recenti appariranno qui</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OwnerHome;
