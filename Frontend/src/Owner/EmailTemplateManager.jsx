import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { Mail, Plus, Edit, Trash2, Eye, Save, X, Code } from 'lucide-react';

const EmailTemplateManager = () => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (user) fetchTemplates();
    }, [user]);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('email_templates')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;
            setTemplates(data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const { error } = await supabase
                .from('email_templates')
                .update({
                    subject: editingTemplate.subject,
                    html_body: editingTemplate.html_body,
                    text_body: editingTemplate.text_body,
                    is_active: editingTemplate.is_active
                })
                .eq('id', editingTemplate.id);

            if (error) throw error;

            setTemplates(templates.map(t =>
                t.id === editingTemplate.id ? editingTemplate : t
            ));
            setEditingTemplate(null);
            alert('Template salvato con successo!');
        } catch (error) {
            console.error('Error saving template:', error);
            alert('Errore nel salvataggio del template');
        }
    };

    const getPreviewHtml = () => {
        if (!editingTemplate) return '';
        let html = editingTemplate.html_body;

        // Replace variables with example values for preview
        const exampleValues = {
            firstName: 'Mario',
            lastName: 'Rossi',
            email: 'mario.rossi@email.com',
            clubName: 'The Padel Court',
            cardName: 'Carta Promo Gennaio',
            cardType: 'PROMO',
            credits: '10',
            stampsRequired: '10',
            reward: '1 Partita Gratis',
            programName: 'Fidelity 2025',
            totalRewards: '3',
            remaining: '2',
            password: 'Password123',
            loginUrl: window.location.origin + '/login',
            cardsUrl: window.location.origin + '/profile/cards',
            renewUrl: window.location.origin + '/profile/cards',
            stampsNeeded: '3',
            daysRemaining: '5'
        };

        Object.keys(exampleValues).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, exampleValues[key]);
        });

        return html;
    };

    return (
        <div className="owner-section-card h-full flex flex-col">
            <div className="owner-section-card-header">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <Mail className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                        Gestione Template Email
                    </h2>
                    <p className="text-sm text-[var(--owner-text-muted)]">
                        Personalizza i template delle email inviate automaticamente dal sistema
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-6">
                {editingTemplate ? (
                    /* Edit Form */
                    <form onSubmit={handleSave} className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-[var(--owner-card-bg)] border border-[var(--owner-border)] rounded-xl p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-2xl font-bold text-[var(--owner-text-primary)]">{editingTemplate.name}</h3>
                                    <p className="text-sm text-[var(--owner-text-muted)] mt-1">{editingTemplate.description}</p>
                                    <code className="text-xs bg-[var(--owner-bg-secondary)] px-2 py-1 rounded mt-2 inline-block">
                                        {editingTemplate.template_key}
                                    </code>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={editingTemplate.is_active}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                                        className="w-5 h-5"
                                    />
                                    <span className="text-sm font-medium text-[var(--owner-text-secondary)]">Attivo</span>
                                </label>
                            </div>

                            {/* Variables Info */}
                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
                                <div className="flex items-start gap-2">
                                    <Code size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-300 mb-2">Variabili Disponibili:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {JSON.parse(editingTemplate.variables || '[]').map(variable => (
                                                <code key={variable} className="text-xs bg-blue-900/30 text-blue-200 px-2 py-1 rounded">
                                                    {`{{${variable}}}`}
                                                </code>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Subject */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Oggetto Email</label>
                                <input
                                    type="text"
                                    required
                                    value={editingTemplate.subject}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    placeholder="es. Benvenuto su {{clubName}}"
                                />
                            </div>

                            {/* HTML Body */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Corpo HTML</label>
                                <textarea
                                    required
                                    rows="15"
                                    value={editingTemplate.html_body}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, html_body: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none font-mono text-sm"
                                    placeholder="HTML del template..."
                                />
                            </div>

                            {/* Text Body */}
                            <div className="mb-4">
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Corpo Testo (fallback)</label>
                                <textarea
                                    rows="8"
                                    value={editingTemplate.text_body || ''}
                                    onChange={e => setEditingTemplate({ ...editingTemplate, text_body: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none font-mono text-sm"
                                    placeholder="Versione testo semplice..."
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowPreview(!showPreview)}
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] text-[var(--owner-text-primary)] rounded-lg hover:border-[var(--owner-accent)] transition-all"
                                >
                                    <Eye size={18} />
                                    {showPreview ? 'Nascondi' : 'Anteprima'}
                                </button>
                                <button
                                    type="submit"
                                    className="flex items-center gap-2 px-4 py-2 bg-[var(--owner-accent)] text-white rounded-lg hover:bg-[var(--owner-accent-hover)] transition-colors font-bold"
                                >
                                    <Save size={18} />
                                    Salva Modifiche
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingTemplate(null);
                                        setShowPreview(false);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 border border-[var(--owner-border)] text-[var(--owner-text-secondary)] rounded-lg hover:bg-[var(--owner-bg-secondary)] transition-colors"
                                >
                                    <X size={18} />
                                    Annulla
                                </button>
                            </div>
                        </div>

                        {/* Preview */}
                        {showPreview && (
                            <div className="bg-white rounded-xl border-4 border-[var(--owner-border)] overflow-hidden">
                                <div className="bg-gray-800 text-white px-4 py-2 text-sm font-mono">
                                    Anteprima Email (con valori di esempio)
                                </div>
                                <div className="p-6">
                                    <div dangerouslySetInnerHTML={{ __html: getPreviewHtml() }} />
                                </div>
                            </div>
                        )}
                    </form>
                ) : (
                    /* Templates List */
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                className={`p-6 rounded-xl border ${template.is_active
                                    ? 'border-[var(--owner-border)] bg-[var(--owner-card-bg)]'
                                    : 'border-gray-200 bg-gray-50 opacity-60'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-[var(--owner-text-primary)]">{template.name}</h3>
                                        <p className="text-sm text-[var(--owner-text-muted)] mt-1">{template.description}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${template.is_active ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'
                                        }`}>
                                        {template.is_active ? 'ATTIVO' : 'DISATTIVO'}
                                    </span>
                                </div>

                                <div className="bg-[var(--owner-bg-primary)] p-3 rounded-lg mb-3">
                                    <p className="text-xs text-[var(--owner-text-muted)] mb-1">Oggetto:</p>
                                    <p className="text-sm text-[var(--owner-text-primary)] font-medium">{template.subject}</p>
                                </div>

                                <div className="flex items-center justify-between text-xs text-[var(--owner-text-muted)]">
                                    <code className="bg-[var(--owner-bg-secondary)] px-2 py-1 rounded">
                                        {template.template_key}
                                    </code>
                                    <button
                                        onClick={() => setEditingTemplate(template)}
                                        className="flex items-center gap-1 text-[var(--owner-accent)] hover:text-[var(--owner-accent-hover)] font-medium"
                                    >
                                        <Edit size={14} />
                                        Modifica
                                    </button>
                                </div>
                            </div>
                        ))}

                        {!loading && templates.length === 0 && (
                            <div className="col-span-full text-center py-12">
                                <Mail size={48} className="mx-auto mb-4 opacity-50 text-[var(--owner-text-muted)]" />
                                <p className="text-[var(--owner-text-muted)]">Nessun template configurato.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailTemplateManager;
