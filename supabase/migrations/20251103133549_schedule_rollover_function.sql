-- 1. Enable the pg_cron extension if it's not already
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Grant cron usage to the 'postgres' user
-- (This is usually the superuser on Supabase)
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT all ON all tables in schema cron TO postgres;

-- 3. Schedule the function to run at midnight every day
-- This command tells pg_cron to:
-- '0 0 * * *' = Run at 00:00 (midnight) every day
-- 'SELECT net.http_post(...' = The command to run
-- We are POSTing to our own function's endpoint.

SELECT cron.schedule(
  'daily-subscription-rollover', -- A unique name for our job
  '0 0 * * *',                   -- "At midnight every day"
  $$
  SELECT net.http_post(
      -- Deno.env.get('SUPABASE_URL') + '/functions/v1/subscription-rollover'
      -- We must construct the URL manually here
      'https://aqpnksnxuiutwobkwzst.supabase.co/functions/v1/subscription-rollover',
      '{}'::jsonb,
      '{}'::jsonb,
      -- We must pass the service_role key to authorize the function call
      -- This is secure as it's stored inside the database
      '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxcG5rc254dWl1dHdvYmt3enN0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjA1NzcwNywiZXhwIjoyMDc3NjMzNzA3fQ.QsvFNfhMihltdXq8aiyEJNISP5n0gSIHR52umobGfBI"}'::jsonb
  );
  $$
);