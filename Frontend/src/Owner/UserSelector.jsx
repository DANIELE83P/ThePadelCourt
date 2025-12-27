import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Search, User, X } from 'lucide-react';

const UserSelector = ({ onSelect, selectedUser }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const searchUsers = async () => {
            if (query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, email, phone')
                    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
                    .limit(5);

                if (error) throw error;
                setResults(data || []);
            } catch (error) {
                console.error('Error searching users:', error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSelect = (user) => {
        onSelect(user);
        setQuery('');
        setShowResults(false);
    };

    const handleClear = () => {
        onSelect(null);
        setQuery('');
    };

    if (selectedUser) {
        return (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        <User size={16} />
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">{selectedUser.full_name}</p>
                        <p className="text-xs text-gray-500">{selectedUser.email}</p>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="p-1 hover:bg-green-200 rounded-full text-green-600 transition-colors"
                >
                    <X size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowResults(true);
                    }}
                    onFocus={() => setShowResults(true)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] focus:ring-2 focus:ring-[var(--owner-accent)] focus:border-transparent outline-none transition-all"
                    placeholder="Cerca cliente per nome o email..."
                />
            </div>

            {showResults && (query.length >= 2 || results.length > 0) && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Ricerca in corso...
                        </div>
                    ) : results.length > 0 ? (
                        <ul>
                            {results.map((user) => (
                                <li
                                    key={user.id}
                                    onClick={() => handleSelect(user)}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-none"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                                        <User size={16} />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">{user.full_name}</p>
                                        <div className="flex gap-2 text-xs text-gray-500">
                                            <span>{user.email}</span>
                                            {user.phone && <span>• {user.phone}</span>}
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            Nessun utente trovato
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserSelector;
