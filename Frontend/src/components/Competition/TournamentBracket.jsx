import React from 'react';
import { motion } from 'framer-motion';

const TournamentBracket = ({ tournament }) => {
    const matches = tournament?.matches || [];

    // Group matches by round
    const roundsMap = matches.reduce((acc, match) => {
        const round = match.tournament_round || 1;
        if (!acc[round]) acc[round] = [];
        acc[round].push(match);
        return acc;
    }, {});

    const roundNumbers = Object.keys(roundsMap).sort((a, b) => a - b);
    const roundNames = ['Quarti', 'Semifinali', 'Finale']; // Simplification

    return (
        <div className="overflow-x-auto py-12">
            <div className="flex gap-12 min-w-max px-8">
                {roundNumbers.map((rNum, rIndex) => (
                    <div key={rNum} className="flex flex-col gap-8 w-72">
                        <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 text-center">
                            Round {rNum}
                        </h4>
                        <div className="flex-1 flex flex-col justify-around gap-12">
                            {roundsMap[rNum].sort((a, b) => a.tournament_position - b.tournament_position).map((match, mIndex) => {
                                const team1 = tournament.teams?.find(t => t.id === match.team1_id);
                                const team2 = tournament.teams?.find(t => t.id === match.team2_id);

                                return (
                                    <motion.div
                                        key={match.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="relative"
                                    >
                                        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl hover:border-lime-500/30 transition-all">
                                            {/* Team 1 */}
                                            <div className="p-4 flex justify-between items-center border-b border-gray-800/50">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${team1 ? 'bg-lime-500' : 'bg-gray-800'}`}></div>
                                                    <span className={`text-xs font-bold uppercase tracking-tighter ${!team1 && 'text-gray-600'}`}>
                                                        {team1?.team_name || 'TBD'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Team 2 */}
                                            <div className="p-4 flex justify-between items-center">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${team2 ? 'bg-lime-500' : 'bg-gray-800'}`}></div>
                                                    <span className={`text-xs font-bold uppercase tracking-tighter ${!team2 && 'text-gray-600'}`}>
                                                        {team2?.team_name || 'TBD'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connection Lines */}
                                        {rIndex < roundNumbers.length - 1 && (
                                            <div className="absolute top-1/2 -right-12 w-12 h-[1px] bg-gray-800"></div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TournamentBracket;
