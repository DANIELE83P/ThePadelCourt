import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { CreditCard, Award, QrCode, Download, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

const UserCards = () => {
    const { user } = useAuth();
    const [promoCards, setPromoCards] = useState([]);
    const [loyaltyCards, setLoyaltyCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch Promo Cards
            const { data: promos, error: promoError } = await supabase
                .from('user_promo_cards')
                .select('*')
                .eq('user_id', user.id)
                .neq('status', 'EXHAUSTED');

            // Fetch Loyalty Cards
            const { data: loyalties, error: loyaltyError } = await supabase
                .from('user_loyalty_cards')
                .select('*, loyalty_programs(name, stamps_required, reward_description)')
                .eq('user_id', user.id)
                .eq('status', 'ACTIVE');

            if (promoError) throw promoError;
            if (loyaltyError) throw loyaltyError;

            setPromoCards(promos || []);
            setLoyaltyCards(loyalties || []);

        } catch (error) {
            console.error("Error fetching cards:", error);
        } finally {
            setLoading(false);
        }
    };

    const downloadPDF = async (card, type) => {
        try {
            const doc = new jsPDF();
            const cardCode = card.card_code;
            const qrDataUrl = await QRCode.toDataURL(cardCode);
            const cardName = type === 'PROMO' ? card.name : card.loyalty_programs.name;
            const userName = user.user_metadata?.name || "Cliente";

            // Design
            doc.setFillColor(20, 20, 20); // Dark background
            doc.rect(0, 0, 210, 297, 'F');

            // Header
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.text("The Padel Court", 105, 30, { align: "center" });

            // Card Box
            doc.setFillColor(30, 30, 30);
            doc.roundedRect(40, 50, 130, 180, 5, 5, 'F');
            doc.setDrawColor(34, 197, 94); // Green border
            doc.setLineWidth(1);
            doc.roundedRect(40, 50, 130, 180, 5, 5, 'S');

            // Card Title
            doc.setFontSize(20);
            doc.setTextColor(34, 197, 94);
            doc.text(cardName, 105, 70, { align: "center" });

            // User
            doc.setFontSize(14);
            doc.setTextColor(200, 200, 200);
            doc.text(`Intestatario: ${userName}`, 105, 85, { align: "center" });

            // QR Code
            doc.addImage(qrDataUrl, 'PNG', 65, 100, 80, 80);

            // Code Text
            doc.setFontSize(12);
            doc.setTextColor(150, 150, 150);
            doc.text(`Codice: ${cardCode}`, 105, 190, { align: "center" });

            // Footer Info (For Promo only, as requested: "non mostrare partite rimaste nel pdf")
            // But show type clearly
            doc.setFontSize(10);
            doc.text(type === 'PROMO' ? "Promo Card" : "Fidelity Card", 105, 210, { align: "center" });

            doc.save(`${cardName.replace(/\s+/g, '_')}_Card.pdf`);

        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Errore nella generazione del PDF.");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-2 text-white">
                    <CreditCard className="text-green-500" />
                    Le Mie Card
                </h2>
                <p className="text-gray-400">
                    Gestisci i tuoi pacchetti partite e le raccolte punti.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-10 opacity-50 text-white">Caricamento card...</div>
            ) : (promoCards.length === 0 && loyaltyCards.length === 0) ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                    <CreditCard size={48} className="mx-auto text-gray-600 mb-4" />
                    <p className="text-gray-300 mb-2">Non hai ancora nessuna card attiva.</p>
                    <p className="text-sm text-gray-500">
                        Chiedi in reception per acquistare un pacchetto o attivare la fidelity card!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Promo Cards */}
                    {promoCards.map(card => (
                        <div key={card.id} className="relative bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-6 shadow-xl overflow-hidden group hover:border-green-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <CreditCard size={120} />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-1">{card.name}</h3>
                                <div className="inline-block bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded border border-green-500/30 mb-4">
                                    PROMO CARD
                                </div>

                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Partite Rimanenti</p>
                                        <p className="text-3xl font-mono font-bold text-white">
                                            {card.remaining_credits} <span className="text-sm text-gray-500 font-normal">/ {card.total_credits}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-500 text-xs">Scadenza</p>
                                        <p className="text-gray-300 text-sm">Illimitata</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => downloadPDF(card, 'PROMO')}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                                    >
                                        <Download size={16} />
                                        PDF
                                    </button>
                                    <button className="flex-1 bg-black hover:bg-gray-900 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-gray-700">
                                        <Smartphone size={16} />
                                        Wallet
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Loyalty Cards */}
                    {loyaltyCards.map(card => (
                        <div key={card.id} className="relative bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-700/50 rounded-2xl p-6 shadow-xl overflow-hidden group hover:border-indigo-500/50 transition-all">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <Award size={120} />
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-xl font-bold text-white mb-1">{card.loyalty_programs.name}</h3>
                                <div className="inline-block bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30 mb-4">
                                    FIDELITY CARD
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between text-sm mb-2 text-gray-300">
                                        <span>Progressi</span>
                                        <span>{card.current_stamps} / {card.loyalty_programs.stamps_required} Timbri</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                                            style={{ width: `${(card.current_stamps / card.loyalty_programs.stamps_required) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-center text-gray-400 mt-2">
                                        Premio: {card.loyalty_programs.reward_description}
                                    </p>
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={() => downloadPDF(card, 'LOYALTY')}
                                        className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                                    >
                                        <Download size={16} />
                                        PDF
                                    </button>
                                    <button className="flex-1 bg-black hover:bg-gray-900 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm font-medium transition-colors border border-gray-700">
                                        <Smartphone size={16} />
                                        Wallet
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default UserCards;
