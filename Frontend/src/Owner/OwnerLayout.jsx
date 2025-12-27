import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../Contexts/AuthContext";
import { useTheme } from "../Contexts/ThemeContext";
import {
    LayoutDashboard,
    Calendar,
    Building2,
    Plus,
    Settings,
    LogOut,
    ChevronLeft,
    Menu,
    X,
    ListOrdered,
    Sun,
    Moon,
    Users,
    Award,
    QrCode
} from "lucide-react";
import "./OwnerDashboard.css";

const menuSections = [
    {
        title: "Dashboard",
        items: [
            { id: "home", label: "Panoramica", icon: LayoutDashboard },
        ]
    },
    {
        title: "Prenotazioni",
        items: [
            { id: "calendar", label: "Calendario", icon: Calendar },
            // { id: "bookings", label: "Lista Prenotazioni", icon: ListOrdered }, // Future
        ]
    },
    {
        title: "Utenti",
        items: [
            { id: "users", label: "Lista Utenti", icon: Users },
            { id: "loyalty", label: "Programmi Fedeltà", icon: Award },
            { id: "scanner", label: "Scanner Ingressi", icon: QrCode },
        ]
    },
    {
        title: "Gestione Campi",
        items: [
            { id: "courts", label: "Prenota Campo", icon: Building2 },
            { id: "promo", label: "Promo Cards", icon: Plus },
        ]
    },
    {
        title: "Impostazioni",
        items: [
            { id: "settings", label: "Info Club", icon: Settings },
        ]
    }
];

const OwnerLayout = ({ children, activeSection, setActiveSection }) => {
    const navigate = useNavigate();
    const { user, signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate("/");
    };

    const handleMenuClick = (sectionId) => {
        setActiveSection(sectionId);
        setMobileOpen(false);
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
        <div className={`owner-layout theme-${theme}`}>
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
                        <div key={idx} className="owner-menu-section">
                            <div className="owner-menu-section-title">{section.title}</div>
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
                        <h1 className="owner-header-title">{getSectionTitle()}</h1>
                    </div>

                    <div className="owner-header-user">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg hover:bg-white/10 border border-[var(--owner-border)] text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)] transition-colors"
                            aria-label="Toggle Theme"
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <div className="owner-header-avatar">{userInitial}</div>
                        <button className="owner-header-logout" onClick={handleLogout}>
                            <LogOut size={16} className="inline mr-2" />
                            Esci
                        </button>
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
