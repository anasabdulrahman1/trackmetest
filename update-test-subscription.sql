-- Update TestSubT to have payment tomorrow for testing 1-day reminder

UPDATE subscriptions 
SET next_payment_date = '2025-11-08'
WHERE id = '0be770df-6a23-4ac3-9247-73845116dbfe';

-- Verify
SELECT 
  name, 
  next_payment_date, 
  reminder_period,
  DATE '2025-11-07' as today,
  (next_payment_date - DATE '2025-11-07') as days_until
FROM subscriptions 
WHERE id = '0be770df-6a23-4ac3-9247-73845116dbfe';
