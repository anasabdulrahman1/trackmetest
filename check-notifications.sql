-- Check notification_events table for sent notifications
SELECT 
  id,
  user_id,
  subscription_id,
  device_id,
  scheduled_for,
  sent_at,
  offset_days,
  status,
  error,
  created_at
FROM notification_events
ORDER BY created_at DESC
LIMIT 10;

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'notification_events'
) as table_exists;
