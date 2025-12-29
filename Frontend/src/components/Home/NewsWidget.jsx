import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Slider from 'react-slick';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../Contexts/AuthContext';
import { Calendar, Tag, ArrowRight } from 'lucide-react';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const NewsWidget = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNews();
    }, [user]);

    const fetchNews = async () => {
        try {
            let query = supabase
                .from('announcements')
                .select('*')
                .eq('status', 'published')
                .order('created_at', { ascending: false })
                .limit(6);

            const { data, error } = await query;

            if (error) throw error;

            // Client-side filtering for visibility if RLS is not strict enough or for extra safety
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

    const settings = {
        dots: true,
        infinite: false,
        speed: 500,
        slidesToShow: 3,
        slidesToScroll: 1,
        initialSlide: 0,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                }
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1
                }
            }
        ]
    };

    if (loading) return null;
    if (news.length === 0) return null;

    return (
        <section className="py-12 bg-transparent">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-3xl font-extrabold text-[#323643] mb-2">
                            News & Eventi
                        </h2>
                        <p className="text-[#606470] text-lg">
                            Rimani aggiornato su tutte le novità del club
                        </p>
                    </div>
                    <button
                        onClick={() => navigate('/news')}
                        className="hidden md:flex items-center gap-2 text-[var(--owner-accent)] font-bold hover:underline"
                    >
                        Vedi tutte le news <ArrowRight size={18} />
                    </button>
                </div>

                <div className="pb-8">
                    <Slider {...settings}>
                        {news.map((item) => (
                            <div key={item.id} className="px-3 pb-4">
                                <div
                                    onClick={() => navigate('/news')}
                                    className="bg-white rounded-[24px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden cursor-pointer h-[400px] flex flex-col group border-2 border-transparent hover:border-[var(--owner-accent)]"
                                >
                                    {/* Image Section */}
                                    <div className="h-48 relative overflow-hidden bg-gray-100">
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
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold mb-3 uppercase tracking-wide">
                                            <Calendar size={14} />
                                            {new Date(item.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}
                                        </div>

                                        <h3 className="text-xl font-bold text-[#323643] mb-3 line-clamp-2 leading-tight group-hover:text-[var(--owner-accent)] transition-colors">
                                            {item.title}
                                        </h3>

                                        <p className="text-[#9aa0ac] text-sm line-clamp-3 mb-4 flex-1">
                                            {item.content}
                                        </p>

                                        {item.type === 'event' && item.event_date && (
                                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2 text-sm font-bold text-purple-600">
                                                📅 Evento: {new Date(item.event_date).toLocaleDateString('it-IT')} {new Date(item.event_date).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Slider>
                </div>

                <div className="md:hidden text-center mt-4">
                    <button
                        onClick={() => navigate('/news')}
                        className="text-[var(--owner-accent)] font-bold hover:underline"
                    >
                        Vedi tutte le news →
                    </button>
                </div>
            </div>
        </section>
    );
};

export default NewsWidget;
