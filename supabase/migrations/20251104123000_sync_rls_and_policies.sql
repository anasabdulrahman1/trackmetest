-- Migration: Sync RLS enables and policies across environments
-- This mirrors the SQL applied manually in Studio, but idempotent.

-- 1) Enable RLS on target tables (safe if already enabled)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2) Subscriptions policies
DROP POLICY IF EXISTS "Users can read their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can insert their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their subscriptions" ON public.subscriptions;

CREATE POLICY "Users can read their subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 3) Devices policies (manage own rows)
DROP POLICY IF EXISTS "Users can manage their devices" ON public.devices;

CREATE POLICY "Users can manage their devices"
  ON public.devices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4) Profiles policy (read own profile)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;

CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);


