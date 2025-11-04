-- =====================================================================
-- Migration: Fix devices schema, unique constraints, and RLS policies
-- Author: Zoye
-- Created: 2025-11-05
-- Description:
--   • Removes incorrect UNIQUE(user_id) constraint
--   • Adds proper UNIQUE(device_token) constraint
--   • Ensures RLS policies exist for devices and subscriptions
--   • Adds missing indexes and standard timestamps
-- =====================================================================

BEGIN;

-- -----------------------------------------------------
-- 1. Ensure required extensions exist
-- -----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------
-- 2. Devices table structure fix
-- -----------------------------------------------------
-- Drop any conflicting unique constraints
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_user_id_key;
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_user_id_unique;
ALTER TABLE public.devices DROP CONSTRAINT IF EXISTS devices_user_unique;

-- Re-add correct unique constraint on device_token
ALTER TABLE public.devices
  ADD CONSTRAINT devices_device_token_unique UNIQUE (device_token);

-- Ensure useful indexes exist
CREATE INDEX IF NOT EXISTS idx_devices_user_id ON public.devices(user_id);
CREATE INDEX IF NOT EXISTS idx_devices_platform ON public.devices(platform);

-- Add updated_at column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.devices ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;
END$$;

-- Add last_active column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'devices' AND column_name = 'last_active'
  ) THEN
    ALTER TABLE public.devices ADD COLUMN last_active TIMESTAMPTZ DEFAULT now() NOT NULL;
  END IF;
END$$;

-- -----------------------------------------------------
-- 3. RLS Policies
-- -----------------------------------------------------

-- Enable Row Level Security
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop any legacy policies
DROP POLICY IF EXISTS "Users can manage their devices" ON public.devices;
DROP POLICY IF EXISTS "Users can read their subscriptions" ON public.subscriptions;

-- Recreate secure and modern policies
CREATE POLICY "Users can manage their devices"
  ON public.devices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- -----------------------------------------------------
-- 4. Audit triggers (optional best practice)
-- -----------------------------------------------------

-- Create or replace function for auto-updating the 'updated_at' column
CREATE OR REPLACE FUNCTION public.update_devices_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger only if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_devices_updated_at'
  ) THEN
    CREATE TRIGGER update_devices_updated_at
    BEFORE UPDATE ON public.devices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_devices_updated_at_column();
  END IF;
END $$;


-- =====================================================================
-- End of migration
-- =====================================================================
