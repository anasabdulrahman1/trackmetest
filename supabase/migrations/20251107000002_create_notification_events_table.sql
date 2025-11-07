-- Create notification_events table if it doesn't exist
-- This table logs all notification attempts for tracking and debugging

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

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_notification_events_user_sub_scheduled
  ON public.notification_events(user_id, subscription_id, scheduled_for);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_notification_events_status
  ON public.notification_events(status, created_at DESC);

-- Enable RLS
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own notifications" ON public.notification_events;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notification_events;

-- Policy: Users can read their own notification events
CREATE POLICY "Users can read own notifications"
  ON public.notification_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can insert (Edge Functions use service role)
CREATE POLICY "Service role can insert notifications"
  ON public.notification_events
  FOR INSERT
  WITH CHECK (true);

-- Grant permissions
GRANT SELECT ON public.notification_events TO authenticated;
GRANT ALL ON public.notification_events TO service_role;
