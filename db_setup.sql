-- Create club_profiles table
create table if not exists public.club_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  address text,
  phone text,
  email text,
  hours_week text,
  hours_weekend text,
  map_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(owner_id)
);

-- Enable RLS
alter table public.club_profiles enable row level security;

-- Policies
create policy "Users can view all club profiles"
  on public.club_profiles for select
  using ( true );

create policy "Owners can insert their own profile"
  on public.club_profiles for insert
  with check ( auth.uid() = owner_id );

create policy "Owners can update their own profile"
  on public.club_profiles for update
  using ( auth.uid() = owner_id );

-- Create trigger for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
  before update on public.club_profiles
  for each row
  execute procedure public.handle_updated_at();
