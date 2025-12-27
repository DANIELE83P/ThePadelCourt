import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { Lock, AlertTriangle } from 'lucide-react';

const ForcePasswordChange = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validations
        if (formData.newPassword.length < 6) {
            setError('La password deve contenere almeno 6 caratteri.');
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Le password non coincidono.');
            return;
        }

        setLoading(true);

        try {
            // 1. Update password
            const { error: updateError } = await supabase.auth.updateUser({
                password: formData.newPassword
            });

            if (updateError) throw updateError;

            // 2. Remove must_change_password flag
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ must_change_password: false })
                .eq('id', user.id);

            if (profileError) throw profileError;

            alert('Password cambiata con successo! Ora puoi accedere normalmente.');
            navigate('/');

        } catch (error) {
            console.error('Error changing password:', error);
            setError(error.message || 'Errore durante il cambio password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">

                {/* Warning Banner */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                    <AlertTriangle className="text-amber-500 flex-shrink-0" size={24} />
                    <div>
                        <h3 className="text-amber-300 font-bold mb-1">Cambio Password Obbligatorio</h3>
                        <p className="text-amber-200/80 text-sm">
                            Per motivi di sicurezza, devi cambiare la password temporanea prima di continuare.
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-8">
                    <div className="flex items-center justify-center mb-6">
                        <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Lock className="text-amber-500" size={32} />
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white text-center mb-2">Imposta Nuova Password</h2>
                    <p className="text-gray-400 text-center mb-6 text-sm">
                        Scegli una password sicura che ricorderai facilmente
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Nuova Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                                placeholder="Minimo 6 caratteri"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-300 mb-2">Conferma Password</label>
                            <input
                                type="password"
                                required
                                minLength={6}
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-500 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                                placeholder="Ripeti la password"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20"
                        >
                            {loading ? 'Aggiornamento...' : 'Conferma Nuova Password'}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <div className="text-center text-xs text-gray-500">
                            <p>✓ Minimo 6 caratteri</p>
                            <p>✓ Evita password troppo semplici</p>
                            <p>✓ Non condividere la tua password con nessuno</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForcePasswordChange;
