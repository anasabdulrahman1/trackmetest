-- Check if required tables and columns exist

-- 1. Check profiles table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 2. Check if notification_events table exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notification_events'
ORDER BY ordinal_position;

-- 3. Check actual profile data with timezone
SELECT id, email, timezone, created_at
FROM profiles
WHERE id = 'a9357098-8841-4442-8530-ec9a49c4b3cb';
