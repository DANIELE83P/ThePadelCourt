-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. PROMO CARDS ASSIGNED TO USERS
create table if not exists public.user_promo_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  promo_card_id uuid, -- Optional link to original template
  name text not null, -- Snapshot of the name (e.g. "Pacchetto 10 Partite")
  total_credits int not null,
  remaining_credits int not null,
  card_code text unique default encode(gen_random_bytes(6), 'hex'), -- Simple unique code
  status text check (status in ('ACTIVE', 'EXHAUSTED', 'SUSPENDED')) default 'ACTIVE',
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. LOYALTY PROGRAMS (Configured by Owner)
create table if not exists public.loyalty_programs (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid references auth.users(id) not null,
  name text not null,
  stamps_required int not null default 10,
  reward_description text,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- 3. LOYALTY CARDS ASSIGNED TO USERS
create table if not exists public.user_loyalty_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  program_id uuid references public.loyalty_programs(id) on delete cascade not null,
  current_stamps int default 0,
  rewards_earned int default 0, -- How many full cycles completed
  card_code text unique default encode(gen_random_bytes(6), 'hex'),
  status text check (status in ('ACTIVE', 'SUSPENDED')) default 'ACTIVE',
  last_stamp_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. USAGE LOGS (Audit Trail)
create table if not exists public.card_usage_logs (
  id uuid primary key default uuid_generate_v4(),
  card_type text check (card_type in ('PROMO', 'LOYALTY')) not null,
  card_id uuid not null, -- Can Ref user_promo_cards or user_loyalty_cards
  operator_id uuid references auth.users(id), -- Who performed scan
  action text not null, -- DEDUCT_CREDIT, ADD_STAMP, REDEEM_REWARD
  amount int default 1,
  notes text,
  created_at timestamp with time zone default now()
);

-- RLS POLICIES

-- Enable RLS
alter table public.user_promo_cards enable row level security;
alter table public.loyalty_programs enable row level security;
alter table public.user_loyalty_cards enable row level security;
alter table public.card_usage_logs enable row level security;

-- user_promo_cards
drop policy if exists "Users manage their own cards" on public.user_promo_cards;
create policy "Users manage their own cards"
  on public.user_promo_cards for all
  using ( auth.uid() = user_id );

drop policy if exists "Admins/Owners manage all promo cards" on public.user_promo_cards;
create policy "Admins/Owners manage all promo cards"
  on public.user_promo_cards for all
  using ( 
    exists (
      select 1 from profiles 
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- loyalty_programs
drop policy if exists "Owners manage their programs" on public.loyalty_programs;
create policy "Owners manage their programs"
  on public.loyalty_programs for all
  using ( auth.uid() = owner_id );

drop policy if exists "Users view active programs" on public.loyalty_programs;
create policy "Users view active programs"
  on public.loyalty_programs for select
  using ( is_active = true );

-- user_loyalty_cards
drop policy if exists "Users manage their loyalty cards" on public.user_loyalty_cards;
create policy "Users manage their loyalty cards"
  on public.user_loyalty_cards for all
  using ( auth.uid() = user_id );

drop policy if exists "Admins/Owners manage all loyalty cards" on public.user_loyalty_cards;
create policy "Admins/Owners manage all loyalty cards"
  on public.user_loyalty_cards for all
  using ( 
    exists (
      select 1 from profiles 
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- logs
drop policy if exists "Owners view logs" on public.card_usage_logs;
create policy "Owners view logs"
  on public.card_usage_logs for select
  using ( 
    exists (
      select 1 from profiles 
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

drop policy if exists "Owners create logs" on public.card_usage_logs;
create policy "Owners create logs"
  on public.card_usage_logs for insert
  with check (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );
