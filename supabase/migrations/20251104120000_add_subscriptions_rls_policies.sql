-- Migration: Add RLS insert/update/delete policies for subscriptions
-- Ensures clients can manage only their own rows

-- Enable RLS (idempotent)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Clean up any legacy policies to avoid duplicates
DROP POLICY IF EXISTS "Users can insert their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can update their subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can delete their subscriptions" ON public.subscriptions;

-- Allow owners to INSERT their own subscriptions
CREATE POLICY "Users can insert their subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow owners to UPDATE their own subscriptions
CREATE POLICY "Users can update their subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow owners to DELETE their own subscriptions
CREATE POLICY "Users can delete their subscriptions"
  ON public.subscriptions
  FOR DELETE
  USING (auth.uid() = user_id);


