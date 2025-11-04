-- Migration: Extend devices table for multi-device tracking

ALTER TABLE devices
ADD COLUMN IF NOT EXISTS device_name TEXT,
ADD COLUMN IF NOT EXISTS logged_in BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT now();

-- Create index for faster lookups by user and login state
CREATE INDEX IF NOT EXISTS idx_devices_user_loggedin ON devices(user_id, logged_in);