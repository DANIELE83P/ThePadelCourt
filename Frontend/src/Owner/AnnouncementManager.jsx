import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { Megaphone, Plus, Edit2, Trash2, Eye, Calendar, BarChart3, Save } from 'lucide-react';

const AnnouncementManager = () => {
    const { user } = useAuth();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState(null);
    const [form, setForm] = useState({
        type: 'news',
        title: '',
        content: '',
        status: 'draft'
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAnnouncements(data || []);
        } catch (error) {
            console.error('Error fetching announcements:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...form,
                created_by: user.id,
                updated_at: new Date().toISOString()
            };

            if (editingAnnouncement) {
                const { error } = await supabase
                    .from('announcements')
                    .update(payload)
                    .eq('id', editingAnnouncement.id);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('announcements')
                    .insert([payload]);

                if (error) throw error;
            }

            setShowModal(false);
            setEditingAnnouncement(null);
            setForm({ type: 'news', title: '', content: '', status: 'draft' });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            alert('Errore nel salvare l\'annuncio');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Sei sicuro di voler eliminare questo annuncio?')) return;

        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchAnnouncements();
        } catch (error) {
            console.error('Error deleting announcement:', error);
        }
    };

    const handlePublish = async (announcement) => {
        try {
            const { error } = await supabase
                .from('announcements')
                .update({
                    status: 'published',
                    published_at: new Date().toISOString()
                })
                .eq('id', announcement.id);

            if (error) throw error;
            fetchAnnouncements();
        } catch (error) {
            console.error('Error publishing:', error);
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            news: '📰',
            event: '📅',
            poll: '📊',
            promo: '🎁'
        };
        return icons[type] || '📢';
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'bg-gray-500/10 text-gray-500',
            published: 'bg-green-500/10 text-green-500',
            archived: 'bg-red-500/10 text-red-500'
        };
        return styles[status] || styles.draft;
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold flex items-center">
                            <Megaphone className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                            News & Eventi
                        </h2>
                        <p className="text-sm text-[var(--owner-text-muted)]">
                            Gestisci annunci, eventi, sondaggi e promozioni
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingAnnouncement(null);
                            setForm({ type: 'news', title: '', content: '', status: 'draft' });
                            setShowModal(true);
                        }}
                        className="owner-btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Nuovo Annuncio
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--owner-accent)] mx-auto"></div>
                    </div>
                ) : announcements.length === 0 ? (
                    <div className="text-center py-20">
                        <Megaphone size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="text-[var(--owner-text-muted)]">Nessun annuncio creato</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {announcements.map(announcement => (
                            <div
                                key={announcement.id}
                                className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-5 hover:border-[var(--owner-accent)] transition-all"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{getTypeIcon(announcement.type)}</span>
                                            <div>
                                                <h3 className="font-bold text-lg">{announcement.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${getStatusBadge(announcement.status)}`}>
                                                        {announcement.status}
                                                    </span>
                                                    <span className="text-xs text-[var(--owner-text-muted)]">
                                                        {new Date(announcement.created_at).toLocaleDateString('it-IT')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-[var(--owner-text-muted)] line-clamp-2">
                                            {announcement.content}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        {announcement.status === 'draft' && (
                                            <button
                                                onClick={() => handlePublish(announcement)}
                                                className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                                title="Pubblica"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => {
                                                setEditingAnnouncement(announcement);
                                                setForm(announcement);
                                                setShowModal(true);
                                            }}
                                            className="p-2 rounded-lg bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-accent)] hover:text-white"
                                            title="Modifica"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(announcement.id)}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                            title="Elimina"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--owner-card-bg)] rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold mb-4">
                            {editingAnnouncement ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tipo</label>
                                <select
                                    value={form.type}
                                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                    required
                                >
                                    <option value="news">📰 Notizia</option>
                                    <option value="event">📅 Evento</option>
                                    <option value="poll">📊 Sondaggio</option>
                                    <option value="promo">🎁 Promozione</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Titolo</label>
                                <input
                                    type="text"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                    placeholder="Titolo annuncio..."
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Contenuto</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] min-h-[150px]"
                                    placeholder="Scrivi il contenuto dell'annuncio..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 justify-end pt-4 border-t border-[var(--owner-border)]">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] hover:bg-[var(--owner-border)]"
                                >
                                    Annulla
                                </button>
                                <button
                                    type="submit"
                                    className="owner-btn-primary flex items-center gap-2"
                                >
                                    <Save size={18} />
                                    Salva
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnnouncementManager;
