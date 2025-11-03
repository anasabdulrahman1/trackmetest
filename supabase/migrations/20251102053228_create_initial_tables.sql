-- ...existing code...
-- Extensions (ensure pgcrypto/pgsodium are available on your Supabase instance)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- pgsodium is recommended for encryption at rest; enable if available:
-- CREATE EXTENSION IF NOT EXISTS pgsodium;

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'suggested');

-- Profiles table (links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  default_currency TEXT DEFAULT 'INR',
  is_pro BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Payment methods (Pro feature) — store only tokenized/label info, not raw PANs
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- e.g., "Visa *4242"
  type TEXT, -- e.g., 'credit_card', 'paypal'
  token TEXT, -- tokenized identifier from payment gateway (not PAN)
  expiry_date DATE, -- store expiry month/year as DATE (use first day of month)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Subscriptions core table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  billing_cycle TEXT NOT NULL, -- expected values: 'monthly', 'yearly', 'trial'
  next_payment_date DATE NOT NULL,
  reminder_period TEXT, -- e.g., "1,3,7"
  status subscription_status NOT NULL DEFAULT 'active',
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes to support common queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_nextdate ON subscriptions(user_id, next_payment_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- User integrations (encrypted refresh tokens for Pro email scanning)
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  provider TEXT NOT NULL, -- e.g., 'google'
  -- refresh_token must be stored encrypted. Use pgsodium or pgcrypto to encrypt before inserting.
  refresh_token BYTEA NOT NULL,
  last_scan_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_integrations_user ON user_integrations(user_id);

-- Devices table for server-side push notifications
CREATE TABLE IF NOT EXISTS devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  device_token TEXT NOT NULL UNIQUE, -- APNS or FCM token
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id);

-- ...existing code...