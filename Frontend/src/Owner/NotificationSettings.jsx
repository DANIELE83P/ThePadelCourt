import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { Bell, Mail, Smartphone, Save, Search } from 'lucide-react';

const NotificationSettings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, ADMIN, USER

    useEffect(() => {
        if (user) fetchPreferences();
    }, [user]);

    const fetchPreferences = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('notification_preferences')
                .select('*')
                .order('display_name', { ascending: true });

            if (error) throw error;
            setPreferences(data || []);
        } catch (error) {
            console.error('Error fetching preferences:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (eventType, field, value) => {
        try {
            setSaving(true);

            const { error } = await supabase
                .from('notification_preferences')
                .update({ [field]: value })
                .eq('event_type', eventType);

            if (error) throw error;

            setPreferences(preferences.map(pref =>
                pref.event_type === eventType ? { ...pref, [field]: value } : pref
            ));
        } catch (error) {
            console.error('Error updating preference:', error);
            alert('Errore nell\'aggiornamento della preferenza');
        } finally {
            setSaving(false);
        }
    };

    const getCategoryIcon = (pref) => {
        const { event_type, recipient_type } = pref;

        // Priority to recipient type for general categories
        if (recipient_type === 'USER') return '👤';

        const icons = {
            'CARD': '🎁',
            'REWARD': '🏆',
            'DEADLINE': '⏰',
            'BOOKING': '📅',
            'STAMP': '⭐',
            'SYSTEM': '⚙️',
            'REVENUE': '💰',
            'DEMAND': '🔥'
        };

        for (const key in icons) {
            if (event_type.includes(key)) return icons[key];
        }
        return '🔔';
    };

    const filteredPreferences = preferences.filter(pref => {
        const matchesSearch =
            pref.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pref.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pref.event_type.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilter =
            activeFilter === 'ALL' ||
            pref.recipient_type === activeFilter;

        return matchesSearch && matchesFilter;
    });

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
                    <div>
                        <h2 className="text-xl font-bold flex items-center">
                            <Bell className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                            Impostazioni Notifiche
                        </h2>
                        <p className="text-sm text-[var(--owner-text-muted)]">
                            Configura quali notifiche inviare via app e/o email
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                        {/* Filter Tabs */}
                        <div className="flex bg-[var(--owner-bg-secondary)] p-1 rounded-lg border border-[var(--owner-border)]">
                            <button
                                onClick={() => setActiveFilter('ALL')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeFilter === 'ALL'
                                    ? 'bg-[var(--owner-accent)] text-white shadow-lg'
                                    : 'text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)]'
                                    }`}
                            >
                                Tutte
                            </button>
                            <button
                                onClick={() => setActiveFilter('ADMIN')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeFilter === 'ADMIN'
                                    ? 'bg-[var(--owner-accent)] text-white shadow-lg'
                                    : 'text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)]'
                                    }`}
                            >
                                Admin
                            </button>
                            <button
                                onClick={() => setActiveFilter('USER')}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${activeFilter === 'USER'
                                    ? 'bg-[var(--owner-accent)] text-white shadow-lg'
                                    : 'text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)]'
                                    }`}
                            >
                                Utenti
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--owner-text-muted)]" />
                            <input
                                type="text"
                                placeholder="Cerca notifiche..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--owner-accent)] w-full sm:w-64"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="text-center py-12 text-[var(--owner-text-muted)]">
                        Caricamento...
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto space-y-4">
                        {/* Legend */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Bell size={18} className="text-blue-400" />
                                <p className="font-semibold text-blue-300">Legenda</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-blue-200">
                                <div className="flex items-center gap-2">
                                    <Smartphone size={16} />
                                    <span>In-App: Notifica nel centro notifiche dell'applicazione</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail size={16} />
                                    <span>Email: Invio email tramite NotificationAPI</span>
                                </div>
                            </div>
                        </div>

                        {/* Preferences List */}
                        <div className="space-y-3">
                            {filteredPreferences.map(pref => (
                                <div
                                    key={pref.event_type}
                                    className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-5 hover:border-[var(--owner-accent)] transition-all group relative overflow-hidden"
                                >
                                    {/* Audience Indicator Line */}
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${pref.recipient_type === 'ADMIN' ? 'bg-amber-500' : 'bg-blue-500'}`}></div>

                                    <div className="flex items-start justify-between gap-4">
                                        {/* Info */}
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-2xl">{getCategoryIcon(pref)}</span>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-[var(--owner-text-primary)]">
                                                            {pref.display_name}
                                                        </h3>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${pref.recipient_type === 'ADMIN'
                                                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                            }`}>
                                                            {pref.recipient_type === 'ADMIN' ? 'Riservato Admin' : 'Inviato a Utente'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-sm text-[var(--owner-text-muted)] ml-9">
                                                {pref.description}
                                            </p>
                                            <code className="text-[10px] bg-[var(--owner-bg-secondary)] px-2 py-0.5 rounded mt-2 inline-block ml-9 text-[var(--owner-text-muted)] opacity-50">
                                                {pref.event_type}
                                            </code>
                                        </div>

                                        {/* Toggles */}
                                        <div className="flex flex-col gap-3 pt-1">
                                            {/* In-App Toggle */}
                                            <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                <div className="flex items-center gap-2 min-w-[100px] justify-end">
                                                    <span className="text-xs font-medium text-[var(--owner-text-secondary)] group-hover/toggle:text-[var(--owner-text-primary)]">
                                                        In-App
                                                    </span>
                                                    <Smartphone size={14} className="text-[var(--owner-text-secondary)] group-hover/toggle:text-[var(--owner-accent)]" />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.send_in_app}
                                                        onChange={(e) => handleToggle(pref.event_type, 'send_in_app', e.target.checked)}
                                                        disabled={saving}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--owner-accent)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--owner-accent)]"></div>
                                                </div>
                                            </label>

                                            {/* Email Toggle */}
                                            <label className="flex items-center gap-3 cursor-pointer group/toggle">
                                                <div className="flex items-center gap-2 min-w-[100px] justify-end">
                                                    <span className="text-xs font-medium text-[var(--owner-text-secondary)] group-hover/toggle:text-[var(--owner-text-primary)]">
                                                        Email
                                                    </span>
                                                    <Mail size={14} className="text-[var(--owner-text-secondary)] group-hover/toggle:text-[var(--owner-accent)]" />
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.send_email}
                                                        onChange={(e) => handleToggle(pref.event_type, 'send_email', e.target.checked)}
                                                        disabled={saving}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--owner-accent)]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--owner-accent)]"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredPreferences.length === 0 && (
                            <div className="text-center py-20 bg-[var(--owner-card-bg)] rounded-2xl border border-dashed border-[var(--owner-border)]">
                                <Search size={48} className="mx-auto mb-4 opacity-20 text-[var(--owner-text-muted)]" />
                                <p className="text-[var(--owner-text-muted)] font-medium">Nessuna notifica trovata</p>
                                <button
                                    onClick={() => { setSearchTerm(''); setActiveFilter('ALL'); }}
                                    className="mt-4 text-[var(--owner-accent)] text-sm hover:underline"
                                >
                                    Resetta filtri
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

        </div>
    );
};

export default NotificationSettings;
