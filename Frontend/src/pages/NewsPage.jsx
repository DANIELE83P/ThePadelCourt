import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../Contexts/AuthContext';
import { Calendar, Tag, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, news, event, promo

    useEffect(() => {
        fetchNews();
    }, [user]);

    const fetchNews = async () => {
        try {
            let query = supabase
                .from('announcements')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            // Client-side filtering for visibility
            const now = new Date();
            const filteredNews = data.filter(item => {
                // Check Visibility
                const visibility = item.visibility || 'public';
                if (visibility === 'registered' && !user) return false;

                // Check Scheduling
                if (item.valid_from && new Date(item.valid_from) > now) return false;
                if (item.valid_until && new Date(item.valid_until) < now) return false;

                return true;
            });

            setNews(filteredNews);
        } catch (error) {
            console.error('Error fetching news:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayedNews = filter === 'all'
        ? news
        : news.filter(item => item.type === filter);

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="container mx-auto px-4">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-gray-500 hover:text-[var(--owner-accent)] mb-8 transition-colors font-bold"
                >
                    <ArrowLeft className="mr-2" size={20} />
                    Torna alla Home
                </button>

                <div className="flex flex-col md:flex-row justify-between items-center mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold text-[#323643] mb-2">
                            News & Eventi
                        </h1>
                        <p className="text-[#606470] text-lg">
                            Esplora tutte le novità, eventi e promozioni del club.
                        </p>
                    </div>

                    <div className="flex gap-2 mt-4 md:mt-0 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                        {['all', 'news', 'event', 'promo'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                                    ? 'bg-[var(--owner-accent)] text-white shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {f === 'all' ? 'Tutti' : f === 'news' ? 'News' : f === 'event' ? 'Eventi' : 'Promo'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--owner-accent)] mx-auto"></div>
                    </div>
                ) : displayedNews.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100">
                        <p className="text-gray-400 text-lg font-medium">Nessuna notizia trovata.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {displayedNews.map((item) => (
                            <div key={item.id} className="bg-white rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden flex flex-col group border-2 border-transparent hover:border-[var(--owner-accent)]">
                                {/* Image Section */}
                                <div className="h-56 relative overflow-hidden bg-gray-100">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-200 bg-[var(--owner-bg-secondary)]">
                                            {item.type === 'event' ? '📅' : '📰'}
                                        </div>
                                    )}
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${item.type === 'event' ? 'bg-purple-500/90 text-white' :
                                            item.type === 'promo' ? 'bg-orange-500/90 text-white' :
                                                'bg-[var(--owner-accent)] text-white'
                                            }`}>
                                            {item.type === 'poll' ? 'Sondaggio' : item.type === 'promo' ? 'Promo' : item.type === 'event' ? 'Evento' : 'News'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-8 flex flex-col flex-1">
                                    <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-3 uppercase tracking-wide">
                                        <Calendar size={14} />
                                        {new Date(item.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </div>

                                    <h3 className="text-2xl font-bold text-[#323643] mb-4 leading-tight group-hover:text-[var(--owner-accent)] transition-colors">
                                        {item.title}
                                    </h3>

                                    <div className="prose prose-sm text-[#9aa0ac] mb-6 flex-1 line-clamp-4">
                                        {item.content}
                                    </div>

                                    {item.type === 'event' && item.event_date && (
                                        <div className="mt-auto pt-6 border-t border-gray-100 flex items-center gap-2 text-sm font-bold text-purple-600 bg-purple-50 p-3 rounded-xl">
                                            📅 Data Evento: {new Date(item.event_date).toLocaleDateString('it-IT')} <span className="text-purple-400">|</span> {new Date(item.event_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsPage;
