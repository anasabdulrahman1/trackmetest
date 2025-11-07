-- Ensure timezone column exists in profiles table
-- This is a safety migration in case the previous one didn't apply correctly

DO $$
BEGIN
  -- Add timezone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';
    
    RAISE NOTICE 'Added timezone column to profiles table';
  ELSE
    RAISE NOTICE 'Timezone column already exists in profiles table';
  END IF;
END$$;

-- Update existing users to have Asia/Kolkata timezone (Indian timezone)
UPDATE public.profiles
SET timezone = 'Asia/Kolkata'
WHERE timezone = 'UTC' OR timezone IS NULL;
