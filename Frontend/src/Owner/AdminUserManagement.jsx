import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import {
    Search,
    Shield,
    Trash2,
    UserPlus,
    CheckCircle,
    XCircle
} from "lucide-react";

const AdminUserManagement = () => {
    const { user: currentUser } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Create Admin Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAdminData, setNewAdminData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        role: "admin" // or owner
    });
    const [creating, setCreating] = useState(false);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .in('role', ['admin', 'owner'])
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAdmins(data || []);
        } catch (error) {
            console.error("Error fetching admins:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setCreating(true);
        setErrorMsg(null);

        try {
            console.log("Invoking create-user function...");
            // Call Edge Function to create user
            const { data, error } = await supabase.functions.invoke('create-user', {
                body: {
                    email: newAdminData.email,
                    password: newAdminData.password,
                    firstName: newAdminData.first_name,
                    lastName: newAdminData.last_name,
                    role: newAdminData.role
                }
            });

            if (error) throw error;
            if (data?.error) throw new Error(data.error);

            alert(`Amministratore creato con successo!\n\nEmail: ${newAdminData.email}\nPassword: ${newAdminData.password}`);

            setIsCreateModalOpen(false);
            setNewAdminData({
                first_name: "",
                last_name: "",
                email: "",
                password: "",
                role: "admin"
            });

            fetchAdmins();

        } catch (error) {
            console.error("Error creating admin:", error);
            setErrorMsg(error.message || "Errore durante la creazione dell'amministratore.");
        } finally {
            setCreating(false);
        }
    };

    const handleDemote = async (admin) => {
        if (!window.confirm(`Sei sicuro di voler rimuovere i permessi admin a ${admin.name || admin.first_name || admin.email}? L'utente verrà declassato a 'user'.`)) {
            return;
        }

        try {
            setLoading(true);
            const { error } = await supabase
                .from('profiles')
                .update({ role: 'user' })
                .eq('id', admin.id);

            if (error) throw error;

            alert("Permessi revocati con successo.");
            fetchAdmins();
        } catch (error) {
            console.error("Error demoting admin:", error);
            alert("Errore durante la revoca dei permessi: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const filteredAdmins = admins.filter(user =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="owner-section-card h-full flex flex-col">
            {/* Header */}
            <div className="owner-section-card-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <Shield className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                        Gestione Admin
                    </h2>
                    <p className="text-sm text-[var(--owner-text-muted)]">
                        Gestisci gli amministratori e i proprietari del sistema.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--owner-text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Cerca admin..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] text-[var(--owner-text-primary)] focus:outline-none focus:border-[var(--owner-accent)] w-full md:w-64"
                        />
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-[var(--owner-accent)] text-white px-4 py-2 rounded-lg hover:bg-[var(--owner-accent-hover)] transition-colors font-bold whitespace-nowrap"
                    >
                        <UserPlus size={18} />
                        Nuovo Admin
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-0">
                {loading ? (
                    <div className="flex items-center justify-center h-40 opacity-50 text-[var(--owner-text-primary)]">
                        Caricamento admin...
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50 text-center p-4">
                        <Shield size={48} className="mb-4 text-[var(--owner-text-muted)]" />
                        <p className="text-[var(--owner-text-secondary)]">Nessun amministratore trovato.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--owner-bg-secondary)] sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Nome</th>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Email</th>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Ruolo</th>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Data Creazione</th>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--owner-border)]">
                            {filteredAdmins.map(admin => (
                                <tr key={admin.id} className="hover:bg-[var(--owner-bg-secondary)]/50 transition-colors">
                                    <td className="p-4 text-[var(--owner-text-primary)] font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] flex items-center justify-center text-xs font-bold text-[var(--owner-text-muted)]">
                                                {(admin.name || admin.first_name || 'U').substring(0, 2).toUpperCase()}
                                            </div>
                                            {admin.name || `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-[var(--owner-text-secondary)]">
                                        {admin.email}
                                    </td>
                                    <td className="p-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${admin.role === 'owner'
                                            ? 'bg-purple-500/10 text-purple-500 border-purple-500/20'
                                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                            }`}>
                                            {admin.role === 'owner' ? 'Proprietario' : 'Admin'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-[var(--owner-text-muted)] text-sm">
                                        {new Date(admin.created_at).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="p-4 text-center">
                                        {currentUser.id !== admin.id && (
                                            <button
                                                onClick={() => handleDemote(admin)}
                                                className="text-red-500 hover:text-red-700 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                                                title="Declassa a Utente"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Admin Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--owner-card-bg)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--owner-border)] max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[var(--owner-border)] sticky top-0 bg-[var(--owner-card-bg)] z-10">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--owner-text-primary)]">Nuovo Amministratore</h2>
                                <p className="text-sm text-[var(--owner-text-muted)]">Crea un nuovo account con permessi elevati</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)] text-2xl">
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAdminData.first_name}
                                        onChange={(e) => setNewAdminData({ ...newAdminData, first_name: e.target.value })}
                                        className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                        placeholder="Mario"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Cognome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newAdminData.last_name}
                                        onChange={(e) => setNewAdminData({ ...newAdminData, last_name: e.target.value })}
                                        className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                        placeholder="Bianchi"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={newAdminData.email}
                                    onChange={(e) => setNewAdminData({ ...newAdminData, email: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    placeholder="admin@padelcourt.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Password *</label>
                                <input
                                    type="text"
                                    required
                                    minLength={6}
                                    value={newAdminData.password}
                                    onChange={(e) => setNewAdminData({ ...newAdminData, password: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none font-mono"
                                    placeholder="minimo 6 caratteri"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Ruolo *</label>
                                <select
                                    value={newAdminData.role}
                                    onChange={(e) => setNewAdminData({ ...newAdminData, role: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="owner">Proprietario (Owner)</option>
                                </select>
                            </div>

                            {errorMsg && (
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-500 text-sm font-bold">
                                    {errorMsg}
                                </div>
                            )}

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                <p className="text-xs text-amber-400">
                                    ⚠️ L'utente verrà creato immediatamente. Assicurati che l'email sia corretta.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full bg-[var(--owner-accent)] text-white font-bold py-3 rounded-lg hover:bg-[var(--owner-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creazione in corso...' : 'Crea Admin'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUserManagement;
