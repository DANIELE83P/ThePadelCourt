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
    Trash2
} from "lucide-react";
import AssignCardModal from "./AssignCardModal";

const UserManagement = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'user') // Only fetch regular users
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

            // Optimistic update
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

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
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

            <AssignCardModal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                user={selectedUser}
                onSuccess={() => {
                    // Maybe show a toast
                    alert(`Card assegnata con successo a ${selectedUser?.name}`);
                }}
            />
        </div>
    );
};

export default UserManagement;
