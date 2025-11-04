-- Migration: Add RLS policy for profiles select

-- Enable RLS on profiles (idempotent)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop conflicting legacy policies if any
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);


