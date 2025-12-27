import React from 'react';
import { motion } from 'framer-motion';

const TournamentBracket = ({ tournament }) => {
    // Conceptual rendering of a bracket
    // Round 1: [8 players] -> 4 matches
    // Round 2: [4 players] -> 2 matches
    // Round 3: [2 players] -> 1 match

    const rounds = [
        { name: 'Quarti di Finale', matches: [1, 2, 3, 4] },
        { name: 'Semifinali', matches: [1, 2] },
        { name: 'Finale', matches: [1] }
    ];

    return (
        <div className="overflow-x-auto py-12">
            <div className="flex gap-12 min-w-max px-8">
                {rounds.map((round, rIndex) => (
                    <div key={rIndex} className="flex flex-col gap-8 w-64">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 text-center">
                            {round.name}
                        </h4>
                        <div className="flex-1 flex flex-col justify-around gap-12">
                            {round.matches.map((match, mIndex) => (
                                <motion.div
                                    key={mIndex}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative"
                                >
                                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                                        {/* Team A */}
                                        <div className="p-4 flex justify-between items-center border-b border-gray-800/50 hover:bg-white/5 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-lime-500"></div>
                                                <span className="text-xs font-bold uppercase tracking-tighter">Team Alpha</span>
                                            </div>
                                            <span className="font-black text-lime-500">6</span>
                                        </div>
                                        {/* Team B */}
                                        <div className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-gray-700"></div>
                                                <span className="text-xs font-bold uppercase tracking-tighter text-gray-400">Team Beta</span>
                                            </div>
                                            <span className="font-black text-gray-700">2</span>
                                        </div>
                                    </div>

                                    {/* Connection Lines (Conceptual) */}
                                    {rIndex < rounds.length - 1 && (
                                        <div className="absolute top-1/2 -right-12 w-12 h-[1px] bg-gray-800"></div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentBracket;
