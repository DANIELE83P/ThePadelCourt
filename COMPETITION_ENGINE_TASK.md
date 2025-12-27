# Task: Competition Engine Implementation

## 1. Database Schema & Migration
- [x] Add `elo_rating`, `xp`, `level`, `tier` to `profiles`
- [x] Create `matches` table (public matches)
- [x] Create `match_players` table (link users to matches/teams)
- [x] Create `tournaments` table
- [x] Create `tournament_teams` table
- [x] Associate matches with tournaments
- [x] Create RLS policies for competition tables
- [x] Create `match_results` table for score reporting

## 2. Competition Logic (Database functions)
- [x] Implement `handle_match_balancing` trigger (doubles adaptation: 1st+4th vs 2nd+3rd)
- [x] Implement `update_player_elo` trigger (ELO exchange + XP gain + Level progress)
- [ ] Implement bracket generation logic for tournaments

## 3. Frontend - Match Center
- [x] "Open Match" Dashboard: List public matches with status and player slots
- [x] "Create Match" Modal: Selection of court, date, time and match type
- [x] "Join Match" Flow: Functional joining/leaving matches with team assignment
- [ ] Real-time updates for match joining (Supabase Realtime integration)

## 4. Frontend - Tournaments
- [x] Tournament Explorer: List active tournaments with status and registration info
- [ ] Tournament Detail & Brackets: Visual display of tournament progress
- [ ] Registration Flow: Team registration with partner selection

## 5. Gamification & Rankings
- [ ] Global Leaderboard: Professional ranking by Tier and ELO
- [ ] Match Result Reporting: Interface for users to report and confirm scores (mandatory for ELO update)
- [ ] XP Progress Visuals: Animated level-up and XP gain feedback


## 6. Integration & Polish
- [ ] Integrate with existing booking system (auto-create booking when match is locked)
- [ ] Notification system for matches (Join, Full, Result confirmed)
- [ ] Italian localization for all competitive features
