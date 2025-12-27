-- Add new columns to bookings table
alter table public.bookings 
add column if not exists player_names text[] default array[]::text[],
add column if not exists booking_type text default 'online';

-- Optional: Check constraint for booking_type
alter table public.bookings 
add constraint bookings_booking_type_check 
check (booking_type in ('online', 'offline'));
