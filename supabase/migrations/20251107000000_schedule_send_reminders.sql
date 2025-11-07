-- Migration: Schedule send-reminders Edge Function to run hourly
-- This ensures reminder notifications are sent at the appropriate times

-- Schedule the send-reminders function to run every hour
-- The function itself checks if it's within the 8am window for each user's timezone
SELECT cron.schedule(
  'hourly-send-reminders',  -- Unique job name
  '0 * * * *',              -- Run at the start of every hour
  $$
  SELECT net.http_post(
      'https://aqpnksnxuiutwobkwzst.supabase.co/functions/v1/send-reminders',
      '{}'::jsonb,
      '{}'::jsonb,
      '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcG5rc254dWl1dHdvYmt3enN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA1NzcwNywiZXhwIjoyMDc3NjMzNzA3fQ.QsvFNfhMihltdXq8aiyEJNISP5n0gSIHR52umobGfBI"}'::jsonb
  );
  $$
);
