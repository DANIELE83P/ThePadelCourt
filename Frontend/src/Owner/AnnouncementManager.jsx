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
        status: 'published',
        visibility: 'public',
        event_date: '',
        valid_from: '',
        valid_until: '',
        image_url: null
    });
    const [uploading, setUploading] = useState(false);

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

    const handleImageUpload = async (e) => {
        try {
            setUploading(true);
            const file = e.target.files[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `announcements/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('courts') // Using 'courts' bucket as fallback if 'announcements' doesn't exist
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('courts')
                .getPublicUrl(filePath);

            setForm(prev => ({ ...prev, image_url: data.publicUrl }));
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Errore nel caricamento immagine');
        } finally {
            setUploading(false);
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
            setForm({ type: 'news', title: '', content: '', status: 'published', visibility: 'public', event_date: '', valid_from: '', valid_until: '', image_url: null });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error saving announcement:', error);
            alert('Errore nel salvare l\'annuncio');
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent triggering any parent click events
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
                            setForm({ type: 'news', title: '', content: '', status: 'published', visibility: 'public', event_date: '', valid_from: '', valid_until: '', image_url: null });
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
                                className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-5 hover:border-[var(--owner-accent)] transition-all flex gap-4"
                            >
                                {/* Image Preview */}
                                {announcement.image_url && (
                                    <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                        <img src={announcement.image_url} alt={announcement.title} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="flex-1">
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
                                                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${announcement.visibility === 'public' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                            {announcement.visibility === 'public' ? 'Public' : 'Registered Only'}
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
                                                    className="px-3 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm font-bold flex items-center gap-2"
                                                    title="Pubblica"
                                                >
                                                    <Eye size={16} /> Pubblica
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
                                                onClick={(e) => handleDelete(announcement.id, e)}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                                title="Elimina"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-[rgba(224,229,242,0.5)] backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-[var(--owner-card-bg)] rounded-[var(--owner-radius-lg)] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-[var(--owner-shadow-premium)] border border-[var(--owner-border)]">
                        <h3 className="text-xl font-bold mb-4">
                            {editingAnnouncement ? 'Modifica Annuncio' : 'Nuovo Annuncio'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Image Upload */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-2">Immagine Copertina</label>
                                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors">
                                    {form.image_url ? (
                                        <div className="relative w-full h-48">
                                            <img src={form.image_url} alt="Cover" className="w-full h-full object-cover rounded-md" />
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, image_url: null }))}
                                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={uploading}
                                            />
                                            <div className="text-center">
                                                {uploading ? (
                                                    <div className="animate-spin h-6 w-6 border-2 border-[var(--owner-accent)] border-t-transparent rounded-full mx-auto mb-2"></div>
                                                ) : (
                                                    <div className="mb-2 text-gray-400">
                                                        <Plus size={32} className="mx-auto" />
                                                    </div>
                                                )}
                                                <p className="text-sm text-gray-500">
                                                    {uploading ? 'Caricamento...' : 'Clicca o trascina per caricare immagine'}
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
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
                                    <label className="block text-sm font-medium mb-2">Stato</label>
                                    <select
                                        value={form.status}
                                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                    >
                                        <option value="draft">Draft (Bozza)</option>
                                        <option value="published">Pubblicato</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Visibilità</label>
                                    <select
                                        value={form.visibility || 'public'}
                                        onChange={(e) => setForm({ ...form, visibility: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                    >
                                        <option value="public">🌍 Tutti (Pubblico)</option>
                                        <option value="registered">🔒 Solo Registrati</option>
                                    </select>
                                </div>
                                {form.type === 'event' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Data Evento</label>
                                        <input
                                            type="datetime-local"
                                            value={form.event_date || ''}
                                            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                                            className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Pubblica dal (Opzionale)</label>
                                    <input
                                        type="datetime-local"
                                        value={form.valid_from || ''}
                                        onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                    />
                                    <p className="text-xs text-[var(--owner-text-muted)] mt-1">Lascia vuoto per pubblicare subito</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Rimuovi il (Opzionale)</label>
                                    <input
                                        type="datetime-local"
                                        value={form.valid_until || ''}
                                        onChange={(e) => setForm({ ...form, valid_until: e.target.value })}
                                        className="w-full px-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)]"
                                    />
                                    <p className="text-xs text-[var(--owner-text-muted)] mt-1">Lascia vuoto per non rimuovere mai</p>
                                </div>
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
