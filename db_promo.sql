-- Promo Cards Table
create table if not exists public.promo_cards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  name text not null,
  credits int not null,
  price decimal(10,2) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- User Credits Table (Wallet)
create table if not exists public.user_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  remaining_credits int default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.promo_cards enable row level security;
alter table public.user_credits enable row level security;

-- Policies for Promo Cards
create policy "Public can view promo cards"
  on public.promo_cards for select
  using ( true );

create policy "Owners can manage their promo cards"
  on public.promo_cards for all
  using ( auth.uid() = owner_id );

-- Policies for User Credits
create policy "Users can view their own credits"
  on public.user_credits for select
  using ( auth.uid() = user_id );

create policy "System can update credits" 
  on public.user_credits for all
  using ( true ); -- In real app, restrict this carefully or use service role
