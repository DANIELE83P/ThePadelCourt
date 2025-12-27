import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';

const LevelUpEffect = ({ newLevel, isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#bef264', '#ffffff', '#84cc16']
            });

            const timer = setTimeout(() => {
                onClose();
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="bg-black/80 backdrop-blur-2xl border-4 border-lime-500 p-12 rounded-[4rem] text-center shadow-[0_0_100px_rgba(190,242,100,0.3)]"
                    >
                        <motion.div
                            animate={{ rotate: [0, 15, -15, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="inline-block mb-6"
                        >
                            <Trophy size={100} className="text-lime-500" />
                        </motion.div>
                        <h2 className="text-[120px] font-black leading-none text-white italic tracking-tighter mb-4">
                            LEVEL <span className="text-lime-500">UP</span>
                        </h2>
                        <div className="flex items-center justify-center gap-4">
                            <Star className="text-lime-500 fill-current" size={32} />
                            <span className="text-6xl font-black text-white uppercase tracking-tighter">NEW RANK: {newLevel}</span>
                            <Star className="text-lime-500 fill-current" size={32} />
                        </div>
                        <p className="text-gray-400 mt-6 font-bold uppercase tracking-widest">Sei un gradino più vicino alla leggenda.</p>
                    </motion.div>

                    {/* Ambient Glow */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 0.4, 0] }}
                        className="absolute inset-0 bg-lime-500/20 mix-blend-screen"
                    />
                </div>
            )}
        </AnimatePresence>
    );
};

export default LevelUpEffect;
