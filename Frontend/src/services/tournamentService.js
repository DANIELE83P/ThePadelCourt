import { supabase } from '../lib/supabase';

export const tournamentService = {
    async getTournaments() {
        const { data, error } = await supabase
            .from('tournaments')
            .select(`
                *,
                teams:tournament_teams(count)
            `)
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getTournamentDetails(id) {
        const { data, error } = await supabase
            .from('tournaments')
            .select(`
                *,
                teams:tournament_teams(*, 
                    player1:profiles!tournament_teams_player1_id_fkey(id, name, first_name, last_name, elo_rating),
                    player2:profiles!tournament_teams_player2_id_fkey(id, name, first_name, last_name, elo_rating)
                ),
                matches:matches(*)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async registerTeam(tournamentId, player1Id, player2Id, teamName) {
        const { data, error } = await supabase
            .from('tournament_teams')
            .insert([{
                tournament_id: tournamentId,
                player1_id: player1Id,
                player2_id: player2Id,
                team_name: teamName
            }]);

        if (error) throw error;
        return data;
    }
};
