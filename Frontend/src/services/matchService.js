import { supabase } from '../lib/supabase';

export const matchService = {
    async getOpenMatches() {
        const { data, error } = await supabase
            .from('matches')
            .select(`
        *,
        creator:profiles!matches_creator_id_fkey(id, name, first_name, last_name),
        court:courts(id, name, location),
        players:match_players(
          id,
          user_id,
          team,
          slot,
          user:profiles(id, name, first_name, last_name, elo_rating, tier)
        )
      `)
            .eq('status', 'open')
            .order('match_date', { ascending: true })
            .order('start_time', { ascending: true });

        if (error) throw error;
        return data;
    },

    async createMatch(matchData) {
        const { data, error } = await supabase
            .from('matches')
            .insert([matchData])
            .select()
            .single();

        if (error) throw error;

        // Automatically add creator as player 1
        await this.joinMatch(data.id, matchData.creator_id, 1, 1);

        return data;
    },

    async joinMatch(matchId, userId, team, slot) {
        const { data, error } = await supabase
            .from('match_players')
            .insert([{
                match_id: matchId,
                user_id: userId,
                team: team,
                slot: slot
            }]);

        if (error) throw error;

        // Check if match is now full (4 players)
        const { count } = await supabase
            .from('match_players')
            .select('*', { count: 'exact', head: true })
            .eq('match_id', matchId);

        if (count === 4) {
            await supabase
                .from('matches')
                .update({ status: 'full' })
                .eq('id', matchId);
        }

        return data;
    },

    async leaveMatch(matchId, userId) {
        const { error } = await supabase
            .from('match_players')
            .delete()
            .match({ match_id: matchId, user_id: userId });

        if (error) throw error;

        // If match was full, set it back to open
        await supabase
            .from('matches')
            .update({ status: 'open' })
            .eq('id', matchId)
            .eq('status', 'full');
    }
};
