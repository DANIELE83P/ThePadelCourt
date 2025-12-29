-- 1. Add new columns for News & Events
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public',
ADD COLUMN IF NOT EXISTS event_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published',
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS valid_until TIMESTAMP WITH TIME ZONE;

-- 2. Update existing records to have defaults
UPDATE announcements SET status = 'published' WHERE status IS NULL;
UPDATE announcements SET visibility = 'public' WHERE visibility IS NULL;

-- 3. Enable Row Level Security (if not already enabled)
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- 4. Create Policy: Allow Public Read access for "published" items
DROP POLICY IF EXISTS "Public can read published announcements" ON announcements;
CREATE POLICY "Public can read published announcements" 
ON announcements FOR SELECT 
USING (status = 'published');

-- 5. Create Policy: Allow Owners/Admins full access
DROP POLICY IF EXISTS "Authenticated users can manage announcements" ON announcements;
CREATE POLICY "Authenticated users can manage announcements" 
ON announcements FOR ALL 
USING (auth.role() = 'authenticated');

-- 6. Create Storage Bucket for Images (if not exists)
insert into storage.buckets (id, name, public)
values ('courts', 'courts', true)
on conflict (id) do nothing;

-- 7. Storage Policy: Allow public to view images
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'courts' );

-- 8. Storage Policy: Allow authenticated users to upload
create policy "Auth Upload"
  on storage.objects for insert
  with check ( bucket_id = 'courts' and auth.role() = 'authenticated' );
