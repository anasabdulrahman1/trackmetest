-- Verify notification_events table exists and check structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'notification_events'
ORDER BY ordinal_position;

-- Check if there are any notification events logged
SELECT COUNT(*) as total_notifications FROM notification_events;

-- View recent notification events
SELECT 
  id,
  user_id,
  subscription_id,
  scheduled_for,
  sent_at,
  offset_days,
  status,
  error,
  created_at
FROM notification_events
ORDER BY created_at DESC
LIMIT 10;
