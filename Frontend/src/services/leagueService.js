import { supabase } from '../lib/supabase';

export const leagueService = {
    async getLeagues() {
        const { data, error } = await supabase
            .from('leagues')
            .select(`
                *,
                teams:league_teams(count)
            `)
            .order('start_date', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getLeagueDetails(id) {
        const { data: league, error: lError } = await supabase
            .from('leagues')
            .select('*')
            .eq('id', id)
            .single();

        if (lError) throw lError;

        const { data: standings, error: sError } = await supabase
            .from('league_standings')
            .select('*')
            .eq('league_id', id);

        if (sError) throw sError;

        const { data: matches, error: mError } = await supabase
            .from('matches')
            .select('*')
            .eq('league_id', id);

        if (mError) throw mError;

        return { ...league, standings, matches };
    },

    async registerLeagueTeam(leagueId, player1Id, player2Id, teamName) {
        const { data, error } = await supabase
            .from('league_teams')
            .insert([{
                league_id: leagueId,
                player1_id: player1Id,
                player2_id: player2Id,
                team_name: teamName
            }]);

        if (error) throw error;
        return data;
    }
};
