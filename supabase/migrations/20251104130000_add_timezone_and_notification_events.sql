-- Migration: Add timezone to profiles and notification_events table with RLS

-- 1) profiles.timezone (default UTC)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'timezone'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN timezone TEXT NOT NULL DEFAULT 'UTC';
  END IF;
END$$;

-- 2) notification_events table
CREATE TABLE IF NOT EXISTS public.notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE CASCADE NOT NULL,
  device_id UUID REFERENCES public.devices(id) ON DELETE SET NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  offset_days INT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued | sent | failed
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_events_user_sub_scheduled
  ON public.notification_events(user_id, subscription_id, scheduled_for);

-- 3) RLS policies (service role bypasses; owners can read)
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own notifications" ON public.notification_events;
CREATE POLICY "Users can read own notifications"
  ON public.notification_events
  FOR SELECT
  USING (auth.uid() = user_id);


