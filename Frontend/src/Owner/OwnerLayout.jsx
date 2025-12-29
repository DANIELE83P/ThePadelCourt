import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import { useTheme } from "../Contexts/ThemeContext";
import NotificationCenter from "../components/NotificationCenter";
import {
    LayoutDashboard,
    Calendar,
    Building2,
    Plus,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronDown,
    Menu,
    X,
    ListOrdered,
    Sun,
    Moon,
    Users,
    Award,
    QrCode,
    Mail,
    Bell,
    TrendingUp,
    Megaphone,
    DollarSign,
    Clock,
    CalendarX,
    Repeat
} from "lucide-react";
import "./OwnerDashboard.css";

const menuSections = [
    {
        title: "Dashboard",
        items: [
            { id: "home", label: "Panoramica", icon: LayoutDashboard },
            { id: "announcements", label: "News & Eventi", icon: Megaphone },
        ]
    },
    {
        title: "Competizioni",
        items: [
            { id: "tournaments", label: "Gestione Tornei", icon: Award },
        ]
    },
    {
        title: "Prenotazioni",
        items: [
            { id: "calendar", label: "Calendario", icon: Calendar },
            { id: "recurring", label: "Ricorrenti", icon: Repeat },
        ]
    },
    {
        title: "Utenti",
        items: [
            { id: "users", label: "Lista Utenti", icon: Users },
            { id: "loyalty", label: "Programmi Fedeltà", icon: Award },
            { id: "scanner", label: "Scanner Ingressi", icon: QrCode },
            { id: "email-templates", label: "Template Email", icon: Mail },
            { id: "admin-users", label: "Gestione Admin", icon: Users },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
        ]
    },
    {
        title: "Gestione Campi",
        items: [
            { id: "courts", label: "Impostazioni Campi", icon: Building2 },
            { id: "court-pricing", label: "Prezzi Dinamici", icon: DollarSign },
            { id: "promo", label: "Promo Cards", icon: Plus },
        ]
    },
    {
        title: "Impostazioni",
        items: [
            { id: "settings", label: "Info Club", icon: Settings },
            { id: "club-hours", label: "Orari Apertura", icon: Clock },
            { id: "closures", label: "Chiusure", icon: CalendarX },
            { id: "notifications", label: "Notifiche", icon: Bell },
        ]
    }
];

const OwnerLayout = ({ children, activeSection, setActiveSection }) => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    // Theme context is no longer needed as we enforce light theme
    // const { theme, toggleTheme } = useTheme(); 
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsedSections, setCollapsedSections] = useState({});

    // Run daily scheduler on mount
    useEffect(() => {
        const runScheduler = async () => {
            const { shouldRunScheduler, runDailyScheduler } = await import('../services/schedulerService');

            if (shouldRunScheduler()) {
                console.log('[OwnerLayout] Running daily scheduler...');
                const result = await runDailyScheduler(user.id);

                if (result.success && result.stats) {
                    console.log('[OwnerLayout] Scheduler stats:', result.stats);
                }
            }
        };

        if (user) {
            runScheduler();
        }
    }, [user]);

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    const handleMenuClick = (sectionId) => {
        setActiveSection(sectionId);
        setMobileOpen(false);
    };

    const toggleSection = (sectionTitle) => {
        setCollapsedSections(prev => ({
            ...prev,
            [sectionTitle]: !prev[sectionTitle]
        }));
    };

    const getSectionTitle = () => {
        for (const section of menuSections) {
            const item = section.items.find(i => i.id === activeSection);
            if (item) return item.label;
        }
        return "Dashboard";
    };

    const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

    return (
        <div className={`owner-layout`}>
            {/* Mobile Overlay */}
            <div
                className={`owner-overlay ${mobileOpen ? 'visible' : ''}`}
                onClick={() => setMobileOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`owner-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Toggle Button */}
                <button
                    className="owner-sidebar-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    aria-label="Toggle sidebar"
                >
                    <ChevronLeft />
                </button>

                {/* Sidebar Header */}
                <div className="owner-sidebar-header">
                    <div className="owner-sidebar-logo">🎾</div>
                    <span className="owner-sidebar-title">PadelCourt</span>
                </div>

                {/* Navigation */}
                <nav className="owner-sidebar-nav">
                    {menuSections.map((section, idx) => (
                        <div key={idx} className={`owner-menu-section ${collapsedSections[section.title] ? 'collapsed' : ''}`}>
                            <div
                                className="owner-menu-section-header"
                                onClick={() => toggleSection(section.title)}
                            >
                                <div className="owner-menu-section-title">{section.title}</div>
                                {!collapsed && (
                                    <div className="owner-menu-section-toggle">
                                        <ChevronDown size={14} />
                                    </div>
                                )}
                            </div>
                            <div className="owner-menu-section-items">
                                {section.items.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={item.id}
                                            className={`owner-menu-item ${activeSection === item.id ? 'active' : ''}`}
                                            onClick={() => handleMenuClick(item.id)}
                                            data-tooltip={item.label}
                                        >
                                            <div className="owner-menu-item-icon">
                                                <Icon />
                                            </div>
                                            <span className="owner-menu-item-text">{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer / Mobile Close */}
                <div className="p-4 border-t border-[var(--owner-border)] lg:hidden">
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="w-full flex items-center justify-center gap-2 text-[var(--owner-text-secondary)] py-2"
                    >
                        <X size={18} />
                        <span>Chiudi</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={`owner-main ${collapsed ? 'collapsed' : ''}`}>
                {/* Header */}
                <header className="owner-header">
                    <div className="flex items-center gap-4">
                        {/* Mobile Toggle */}
                        <button
                            className="owner-mobile-toggle"
                            onClick={() => setMobileOpen(true)}
                        >
                            <Menu />
                        </button>
                        <h1 className="owner-header-title">
                            <span className="text-xs font-medium text-[var(--owner-text-secondary)] uppercase tracking-wide">Pagine / {getSectionTitle()}</span>
                            <span>{getSectionTitle()}</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Notification Bubble */}
                        <div className="bg-white h-11 w-11 flex items-center justify-center rounded-full shadow-[var(--owner-shadow-soft)] border border-white">
                            <NotificationCenter />
                        </div>

                        {/* Profile Pill */}
                        <div className="owner-header-user">
                            <div className="owner-header-avatar shadow-md ring-2 ring-white">{userInitial}</div>

                            <button
                                className="p-2 hover:bg-gray-100 rounded-lg text-[var(--owner-text-secondary)] hover:text-red-500 transition-colors"
                                onClick={handleLogout}
                                title="Esci"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <div className="owner-content">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default OwnerLayout;
