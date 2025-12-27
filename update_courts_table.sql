-- Add new columns to courts table if they don't exist
ALTER TABLE public.courts 
ADD COLUMN IF NOT EXISTS number INTEGER,
ADD COLUMN IF NOT EXISTS is_indoor BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS court_img_public_id TEXT;

-- Update existing rows to have default values if needed (optional)
-- UPDATE public.courts SET features = '{}' WHERE features IS NULL;
