import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import {
    Search,
    UserX,
    UserCheck,
    CreditCard,
    MoreVertical,
    Shield,
    Trash2,
    UserPlus
} from "lucide-react";
import AssignCardModal from "./AssignCardModal";
import { notify } from "../utils/notification";

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Create User Modal
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newUserData, setNewUserData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        birth_date: "",
        password: ""
    });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'user')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleBlockStatus = async (userId, currentStatus) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ is_blocked: !currentStatus })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === userId ? { ...u, is_blocked: !currentStatus } : u
            ));
        } catch (error) {
            console.error("Error updating block status:", error);
            alert("Errore durante l'aggiornamento dello stato utente.");
        }
    };

    const handleAssignClick = (user) => {
        setSelectedUser(user);
        setIsAssignModalOpen(true);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreating(true);

        try {
            // 1. Create user with password
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: newUserData.email,
                password: newUserData.password,
                email_confirm: true,
                user_metadata: {
                    first_name: newUserData.first_name,
                    last_name: newUserData.last_name,
                    role: 'user'
                }
            });

            if (authError) throw authError;

            // 2. Update profile with full data
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: newUserData.first_name,
                    last_name: newUserData.last_name,
                    name: `${newUserData.first_name} ${newUserData.last_name}`,
                    phone: newUserData.phone,
                    birth_date: newUserData.birth_date,
                    must_change_password: true,
                    role: 'user'
                })
                .eq('id', authData.user.id);

            if (profileError) throw profileError;

            // 3. Send credentials via email
            await notify.sendCredentials({
                userId: authData.user.id,
                email: newUserData.email,
                firstName: newUserData.first_name,
                password: newUserData.password
            });

            alert(`Utente creato con successo!\n\nEmail: ${newUserData.email}\nPassword: ${newUserData.password}\n\n⚠️ L'utente dovrà cambiare la password al primo accesso.\n✅ Email inviata a ${newUserData.email}`);

            setIsCreateModalOpen(false);
            setNewUserData({
                first_name: "",
                last_name: "",
                email: "",
                phone: "",
                birth_date: "",
                password: ""
            });

            fetchUsers();

        } catch (error) {
            console.error("Error creating user:", error);
            alert(`Errore: ${error.message}`);
        } finally {
            setCreating(false);
        }
    };

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="owner-section-card h-full flex flex-col">
            {/* Header */}
            <div className="owner-section-card-header flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold flex items-center">
                        <Shield className="w-6 h-6 mr-2 text-[var(--owner-accent)]" />
                        Gestione Utenti
                    </h2>
                    <p className="text-sm text-[var(--owner-text-muted)]">
                        Gestisci i clienti registrati, assegna card e controlla gli accessi.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--owner-text-muted)]" size={18} />
                        <input
                            type="text"
                            placeholder="Cerca cliente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-[var(--owner-border)] bg-[var(--owner-bg-primary)] text-[var(--owner-text-primary)] focus:outline-none focus:border-[var(--owner-accent)] w-full md:w-64"
                        />
                    </div>

                    {/* Create User Button */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 bg-[var(--owner-accent)] text-white px-4 py-2 rounded-lg hover:bg-[var(--owner-accent-hover)] transition-colors font-bold whitespace-nowrap"
                    >
                        <UserPlus size={18} />
                        Nuovo Utente
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto p-0">
                {loading ? (
                    <div className="flex items-center justify-center h-40 opacity-50">
                        Caricamento utenti...
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50 text-center p-4">
                        <UserX size={48} className="mb-4 text-[var(--owner-text-muted)]" />
                        <p>Nessun utente trovato.</p>
                        {searchTerm && <p className="text-sm">Prova a cercare un altro nome.</p>}
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--owner-bg-secondary)] sticky top-0 z-10">
                            <tr>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Nome Utente</th>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Stato</th>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase">Data Registrazione</th>
                                <th className="p-4 border-b border-[var(--owner-border)] font-semibold text-[var(--owner-text-secondary)] text-sm uppercase text-right">Azioni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--owner-border)]">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-[var(--owner-bg-secondary)]/50 transition-colors group">
                                    <td className="p-4 text-[var(--owner-text-primary)] font-medium">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] flex items-center justify-center text-xs font-bold text-[var(--owner-text-muted)]">
                                                {user.name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            {user.name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {user.is_blocked ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                                                Bloccato
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">
                                                Attivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-[var(--owner-text-muted)] text-sm">
                                        {new Date(user.created_at).toLocaleDateString('it-IT')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleAssignClick(user)}
                                                className="p-2 rounded-lg hover:bg-[var(--owner-accent)]/10 text-[var(--owner-accent)] border border-transparent hover:border-[var(--owner-accent)] transition-all"
                                                title="Assegna Card"
                                            >
                                                <CreditCard size={18} />
                                            </button>

                                            <button
                                                onClick={() => toggleBlockStatus(user.id, user.is_blocked)}
                                                className={`p-2 rounded-lg border border-transparent transition-all ${user.is_blocked
                                                    ? 'hover:bg-green-500/10 text-green-500 hover:border-green-500'
                                                    : 'hover:bg-red-500/10 text-red-500 hover:border-red-500'
                                                    }`}
                                                title={user.is_blocked ? "Sblocca Utente" : "Blocca Utente"}
                                            >
                                                {user.is_blocked ? <UserCheck size={18} /> : <UserX size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create User Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-[var(--owner-card-bg)] w-full max-w-lg rounded-2xl shadow-2xl border border-[var(--owner-border)] max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-[var(--owner-border)] sticky top-0 bg-[var(--owner-card-bg)] z-10">
                            <div>
                                <h2 className="text-xl font-bold text-[var(--owner-text-primary)]">Crea Nuovo Utente</h2>
                                <p className="text-sm text-[var(--owner-text-muted)]">Inserisci i dati completi del cliente</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)] text-2xl">
                                ✕
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Nome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUserData.first_name}
                                        onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                                        className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                        placeholder="Mario"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Cognome *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newUserData.last_name}
                                        onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                                        className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                        placeholder="Rossi"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Email *</label>
                                <input
                                    type="email"
                                    required
                                    value={newUserData.email}
                                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    placeholder="mario.rossi@email.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Cellulare</label>
                                <input
                                    type="tel"
                                    value={newUserData.phone}
                                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                    placeholder="+39 320 1234567"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Data di Nascita</label>
                                <input
                                    type="date"
                                    value={newUserData.birth_date}
                                    onChange={(e) => setNewUserData({ ...newUserData, birth_date: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-[var(--owner-text-secondary)] mb-2">Password Temporanea *</label>
                                <input
                                    type="text"
                                    required
                                    minLength={6}
                                    value={newUserData.password}
                                    onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                    className="w-full bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] rounded-lg p-3 text-[var(--owner-text-primary)] focus:border-[var(--owner-accent)] outline-none font-mono"
                                    placeholder="minimo 6 caratteri"
                                />
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                                <p className="text-xs text-amber-400">
                                    ⚠️ L'utente riceverà le credenziali via email e dovrà obbligatoriamente cambiare la password al primo accesso.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={creating}
                                className="w-full bg-[var(--owner-accent)] text-white font-bold py-3 rounded-lg hover:bg-[var(--owner-accent-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creating ? 'Creazione in corso...' : 'Crea Utente'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            <AssignCardModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                user={selectedUser}
                onSuccess={() => {
                    alert(`Card assegnata con successo a ${selectedUser?.name}`);
                }}
            />
        </div>
    );
};

export default UserManagement;
